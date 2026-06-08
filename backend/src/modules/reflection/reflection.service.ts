import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  Knowledge,
  KnowledgeType,
} from '../../entities/knowledge.entity';
import { Decision, DecisionStatus } from '../../entities/decision.entity';
import { Lesson } from '../../entities/lesson.entity';
import { ContentSource } from '../../entities/content-base.entity';
import {
  ReflectionRun,
  ReflectionRunStatus,
} from '../../entities/reflection-run.entity';
import {
  ExtractionItem,
  ExtractionKind,
  ExtractionStatus,
} from '../../entities/extraction-item.entity';
import { LinkNodeType, LinkRelation } from '../../entities/entity-link.entity';
import { EmbeddingsService } from '../../core/embeddings/embeddings.service';
import { LlmService } from '../../core/llm/llm.service';
import { QdrantService } from '../../core/qdrant/qdrant.service';
import { AppConfigService } from '../../config/app-config.service';
import { LinksService } from '../links/links.service';
import { chunkText } from '../../common/text/chunk';
import { ReflectRequestDto, ReviewItemDto } from './dto/reflection.dto';

const SYSTEM_PROMPT =
  'You are an organisational knowledge extractor. ' +
  'Analyse the provided text and extract structured information. ' +
  'Return ONLY valid JSON with this exact schema:\n' +
  '{\n' +
  '  "facts": [{"content": "...", "importance": 0.0-1.0}],\n' +
  '  "decisions": [{"title": "...", "reason": "...", "outcome": "..."}],\n' +
  '  "lessons": [{"problem": "...", "solution": "...", "result": "...", "confidence": 0.0-1.0, "decision_ref": null}]\n' +
  '}\n' +
  '"decision_ref" is the 0-based index into THIS response\'s "decisions" array ' +
  'that the lesson stems from, or null if unrelated. ' +
  'All arrays may be empty. Do not include any text outside the JSON object.';

/** Cosine similarity above which a new fact is treated as a duplicate. */
const DUP_THRESHOLD = 0.92;
/** Default days until a freshly extracted fact should be re-reviewed. */
const DEFAULT_REVIEW_DAYS = 180;

interface RawFact {
  content?: unknown;
  importance?: unknown;
}
interface RawDecision {
  title?: unknown;
  reason?: unknown;
  outcome?: unknown;
}
interface RawLesson {
  problem?: unknown;
  solution?: unknown;
  result?: unknown;
  confidence?: unknown;
  decision_ref?: unknown;
}

interface CollectedDecision {
  localIndex: number;
  title: string;
  reason: string;
  outcome: string | null;
}
interface CollectedLesson {
  problem: string;
  solution: string;
  result: string | null;
  confidence: number;
  decisionRef: number | null;
}
interface CollectedFact {
  content: string;
  importance: number;
}

@Injectable()
export class ReflectionService {
  private readonly logger = new Logger(ReflectionService.name);

  constructor(
    @InjectRepository(Knowledge)
    private readonly knowledgeRepo: Repository<Knowledge>,
    @InjectRepository(Decision)
    private readonly decisionRepo: Repository<Decision>,
    @InjectRepository(Lesson)
    private readonly lessonRepo: Repository<Lesson>,
    @InjectRepository(ReflectionRun)
    private readonly runRepo: Repository<ReflectionRun>,
    @InjectRepository(ExtractionItem)
    private readonly itemRepo: Repository<ExtractionItem>,
    private readonly embeddings: EmbeddingsService,
    private readonly llm: LlmService,
    private readonly qdrant: QdrantService,
    private readonly config: AppConfigService,
    private readonly links: LinksService,
  ) {}

  private safeFloat(value: unknown, def: number, lo = 0, hi = 1): number {
    const n = Number(value);
    if (Number.isNaN(n)) {
      return def;
    }
    return Math.max(lo, Math.min(hi, n));
  }

  private truncate(text: string, limit = 512): string {
    return text.slice(0, limit);
  }

  private normalize(text: string): string {
    return text.toLowerCase().replace(/\s+/g, ' ').trim();
  }

  // ── Extraction (staging) ────────────────────────────────────────────────

  /**
   * Enforce a per-organisation daily cap on Reflect runs before any (paid) LLM
   * calls are made. Throws 429 once the limit for the current UTC day is hit.
   */
  private async assertWithinDailyQuota(orgId: string): Promise<void> {
    const limit = this.config.reflectDailyLimit;
    if (limit <= 0) {
      return;
    }
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const used = await this.runRepo.count({
      where: { orgId, createdAt: MoreThanOrEqual(startOfDay) },
    });
    if (used >= limit) {
      throw new HttpException(
        `Daily Reflect limit reached (${limit}/day for this organisation). Try again tomorrow or contact support to raise it.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async reflect(dto: ReflectRequestDto, orgId: string, userId: string | null) {
    await this.assertWithinDailyQuota(orgId);

    const chunks = chunkText(dto.text);
    if (chunks.length === 0) {
      throw new BadRequestException('Text is empty');
    }

    const facts: CollectedFact[] = [];
    const decisions: CollectedDecision[] = [];
    const lessons: CollectedLesson[] = [];

    const seenFacts = new Set<string>();
    const seenLessons = new Set<string>();
    const decisionIndexByTitle = new Map<string, number>();

    for (const chunk of chunks) {
      const data = await this.extractChunk(chunk);
      if (!data) {
        continue;
      }

      // Map this chunk's local decision indices to global localIndex values,
      // merging duplicate decisions across chunks.
      const chunkDecisionMap = new Map<number, number>();
      const rawDecisions = (data.decisions as RawDecision[]) ?? [];
      rawDecisions.forEach((raw, localIdx) => {
        const title = String(raw.title ?? '').trim();
        const reason = String(raw.reason ?? '').trim();
        if (!title || !reason) {
          return;
        }
        const key = this.normalize(title);
        let globalIdx = decisionIndexByTitle.get(key);
        if (globalIdx === undefined) {
          globalIdx = decisions.length;
          decisionIndexByTitle.set(key, globalIdx);
          decisions.push({
            localIndex: globalIdx,
            title: this.truncate(title),
            reason,
            outcome: String(raw.outcome ?? '').trim() || null,
          });
        }
        chunkDecisionMap.set(localIdx, globalIdx);
      });

      const rawLessons = (data.lessons as RawLesson[]) ?? [];
      for (const raw of rawLessons) {
        const problem = String(raw.problem ?? '').trim();
        const solution = String(raw.solution ?? '').trim();
        if (!problem || !solution) {
          continue;
        }
        const key = this.normalize(`${problem}|${solution}`);
        if (seenLessons.has(key)) {
          continue;
        }
        seenLessons.add(key);
        const refRaw = Number(raw.decision_ref);
        const decisionRef = Number.isInteger(refRaw)
          ? (chunkDecisionMap.get(refRaw) ?? null)
          : null;
        lessons.push({
          problem,
          solution,
          result: String(raw.result ?? '').trim() || null,
          confidence: this.safeFloat(raw.confidence, 0.5),
          decisionRef,
        });
      }

      const rawFacts = (data.facts as RawFact[]) ?? [];
      for (const raw of rawFacts) {
        const content = String(raw.content ?? '').trim();
        if (!content) {
          continue;
        }
        const key = this.normalize(content);
        if (seenFacts.has(key)) {
          continue;
        }
        seenFacts.add(key);
        facts.push({
          content,
          importance: this.safeFloat(raw.importance, 0.5),
        });
      }
    }

    const run = await this.runRepo.save(
      this.runRepo.create({
        orgId,
        status: ReflectionRunStatus.pending,
        inputChars: dto.text.length,
        chunkCount: chunks.length,
        model: this.config.chatModel,
        createdBy: userId,
        counts: {
          facts: facts.length,
          decisions: decisions.length,
          lessons: lessons.length,
          duplicates: 0,
        },
      }),
    );

    const items: ExtractionItem[] = [];
    let duplicateCount = 0;

    for (const fact of facts) {
      const dup = await this.findDuplicate(fact.content, orgId);
      if (dup) {
        duplicateCount += 1;
      }
      items.push(
        this.itemRepo.create({
          orgId,
          runId: run.id,
          kind: ExtractionKind.fact,
          status: dup ? ExtractionStatus.duplicate : ExtractionStatus.pending,
          payload: { content: fact.content, importance: fact.importance },
          confidence: fact.importance,
          duplicateOfId: dup?.id ?? null,
          duplicateScore: dup?.score ?? null,
        }),
      );
    }

    for (const decision of decisions) {
      items.push(
        this.itemRepo.create({
          orgId,
          runId: run.id,
          kind: ExtractionKind.decision,
          status: ExtractionStatus.pending,
          payload: {
            title: decision.title,
            reason: decision.reason,
            outcome: decision.outcome,
          },
          confidence: 0.7,
          localIndex: decision.localIndex,
        }),
      );
    }

    for (const lesson of lessons) {
      items.push(
        this.itemRepo.create({
          orgId,
          runId: run.id,
          kind: ExtractionKind.lesson,
          status: ExtractionStatus.pending,
          payload: {
            problem: lesson.problem,
            solution: lesson.solution,
            result: lesson.result,
            confidence: lesson.confidence,
          },
          confidence: lesson.confidence,
          decisionRef: lesson.decisionRef,
        }),
      );
    }

    const saved = await this.itemRepo.save(items);

    if (duplicateCount > 0 && run.counts) {
      run.counts = { ...run.counts, duplicates: duplicateCount };
      await this.runRepo.save(run);
    }

    return {
      run: run.toDict(),
      items: saved.map((i) => i.toDict()),
    };
  }

  private async extractChunk(
    chunk: string,
  ): Promise<Record<string, unknown> | null> {
    let rawResponse: string;
    try {
      rawResponse = await this.llm.chatCompletion(
        [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: chunk },
        ],
        { temperature: 0.3, responseFormat: { type: 'json_object' } },
      );
    } catch (error) {
      this.logger.error(
        `LLM call failed during reflection: ${(error as Error).message}`,
      );
      throw new BadGatewayException(`LLM error: ${(error as Error).message}`);
    }

    try {
      return JSON.parse(rawResponse) as Record<string, unknown>;
    } catch {
      this.logger.warn(
        `LLM returned non-JSON response: ${rawResponse.slice(0, 200)}`,
      );
      return null;
    }
  }

  private async findDuplicate(
    content: string,
    orgId: string,
  ): Promise<{ id: string; score: number } | null> {
    try {
      const vector = await this.embeddings.createEmbedding(content);
      const hits = await this.qdrant.search(
        vector,
        1,
        QdrantService.orgFilter(orgId),
      );
      const top = hits[0];
      if (top && top.score >= DUP_THRESHOLD) {
        const id = String(top.payload?.source_id ?? top.id);
        return { id, score: top.score };
      }
    } catch (error) {
      this.logger.warn(
        `Duplicate check skipped: ${(error as Error).message}`,
      );
    }
    return null;
  }

  // ── Review (human-in-the-loop) ──────────────────────────────────────────

  async listRuns(orgId: string, limit: number, offset: number) {
    const runs = await this.runRepo.find({
      where: { orgId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
    return runs.map((r) => r.toDict());
  }

  private async getRunOr404(runId: string, orgId: string): Promise<ReflectionRun> {
    const run = await this.runRepo.findOne({ where: { id: runId, orgId } });
    if (!run) {
      throw new NotFoundException('Reflection run not found');
    }
    return run;
  }

  async getRun(runId: string, orgId: string) {
    const run = await this.getRunOr404(runId, orgId);
    const items = await this.itemRepo.find({
      where: { runId, orgId },
      order: { kind: 'ASC' },
    });
    return { run: run.toDict(), items: items.map((i) => i.toDict()) };
  }

  async reviewItem(itemId: string, orgId: string, dto: ReviewItemDto) {
    const item = await this.itemRepo.findOne({
      where: { id: itemId, orgId },
    });
    if (!item) {
      throw new NotFoundException('Extraction item not found');
    }
    if (item.status === ExtractionStatus.applied) {
      throw new BadRequestException('Item already applied');
    }
    item.status = dto.status;
    await this.itemRepo.save(item);
    return item.toDict();
  }

  async discardRun(runId: string, orgId: string) {
    const run = await this.getRunOr404(runId, orgId);
    await this.itemRepo
      .createQueryBuilder()
      .update(ExtractionItem)
      .set({ status: ExtractionStatus.rejected })
      .where('run_id = :runId AND org_id = :orgId', { runId, orgId })
      .andWhere('status != :applied', { applied: ExtractionStatus.applied })
      .execute();
    run.status = ReflectionRunStatus.discarded;
    await this.runRepo.save(run);
    return run.toDict();
  }

  // ── Apply (materialise into the knowledge base) ─────────────────────────

  async applyRun(
    runId: string,
    orgId: string,
    userId: string | null,
    itemIds?: string[],
  ) {
    const run = await this.getRunOr404(runId, orgId);
    if (run.status === ReflectionRunStatus.discarded) {
      throw new BadRequestException('Run was discarded');
    }

    const allItems = await this.itemRepo.find({ where: { runId, orgId } });

    // Seed the decision map with decisions already materialised by a prior
    // partial apply so lesson links still resolve.
    const decisionIdByLocal = new Map<number, string>();
    for (const item of allItems) {
      if (
        item.kind === ExtractionKind.decision &&
        item.materializedId &&
        item.localIndex != null
      ) {
        decisionIdByLocal.set(item.localIndex, item.materializedId);
      }
    }

    const isTargeted = (item: ExtractionItem): boolean => {
      if (itemIds && itemIds.length > 0) {
        return itemIds.includes(item.id);
      }
      return (
        item.status === ExtractionStatus.pending ||
        item.status === ExtractionStatus.approved
      );
    };

    const applicable = allItems.filter(
      (i) => i.status !== ExtractionStatus.applied && isTargeted(i),
    );

    const created = { facts: 0, decisions: 0, lessons: 0 };

    // Decisions first so lessons can link to them.
    for (const item of applicable.filter(
      (i) => i.kind === ExtractionKind.decision,
    )) {
      const id = await this.materializeDecision(item, orgId, userId);
      if (item.localIndex != null) {
        decisionIdByLocal.set(item.localIndex, id);
      }
      created.decisions += 1;
    }

    for (const item of applicable.filter(
      (i) => i.kind === ExtractionKind.fact,
    )) {
      await this.materializeFact(item, orgId, userId);
      created.facts += 1;
    }

    for (const item of applicable.filter(
      (i) => i.kind === ExtractionKind.lesson,
    )) {
      await this.materializeLesson(item, orgId, userId, decisionIdByLocal);
      created.lessons += 1;
    }

    // Recompute run status.
    const refreshed = await this.itemRepo.find({ where: { runId, orgId } });
    const allResolved = refreshed.every(
      (i) =>
        i.status === ExtractionStatus.applied ||
        i.status === ExtractionStatus.rejected ||
        i.status === ExtractionStatus.duplicate,
    );
    run.status = allResolved
      ? ReflectionRunStatus.applied
      : ReflectionRunStatus.partial;
    await this.runRepo.save(run);

    return { run: run.toDict(), created };
  }

  private async materializeDecision(
    item: ExtractionItem,
    orgId: string,
    userId: string | null,
  ): Promise<string> {
    const p = item.payload;
    const decision = await this.decisionRepo.save(
      this.decisionRepo.create({
        orgId,
        title: this.truncate(String(p.title ?? '')),
        reason: String(p.reason ?? ''),
        outcome: (p.outcome as string | null) ?? null,
        status: DecisionStatus.accepted,
        source: ContentSource.reflect,
        sourceRef: item.runId,
        createdBy: userId,
      }),
    );
    item.status = ExtractionStatus.applied;
    item.materializedId = decision.id;
    await this.itemRepo.save(item);
    return decision.id;
  }

  private async materializeFact(
    item: ExtractionItem,
    orgId: string,
    userId: string | null,
  ): Promise<void> {
    const p = item.payload;
    const content = String(p.content ?? '');
    const title = this.truncate(content);
    const importance = this.safeFloat(p.importance, 0.5);
    const id = uuidv4();
    const reviewDueAt = new Date(
      Date.now() + DEFAULT_REVIEW_DAYS * 24 * 60 * 60 * 1000,
    );

    const knowledge = this.knowledgeRepo.create({
      id,
      orgId,
      type: KnowledgeType.fact,
      title,
      content,
      importance,
      embeddingId: id,
      source: ContentSource.reflect,
      sourceRef: item.runId,
      createdBy: userId,
      reviewDueAt,
    });

    try {
      const vector = await this.embeddings.createEmbedding(content);
      await this.qdrant.upsert(id, vector, {
        org_id: orgId,
        type: 'fact',
        title,
        content,
        source_id: id,
      });
    } catch (error) {
      knowledge.embeddingId = null;
      this.logger.warn(
        `Qdrant upsert skipped for fact: ${(error as Error).message}`,
      );
    }

    await this.knowledgeRepo.save(knowledge);
    item.status = ExtractionStatus.applied;
    item.materializedId = id;
    await this.itemRepo.save(item);
  }

  private async materializeLesson(
    item: ExtractionItem,
    orgId: string,
    userId: string | null,
    decisionIdByLocal: Map<number, string>,
  ): Promise<void> {
    const p = item.payload;
    const decisionId =
      item.decisionRef != null
        ? (decisionIdByLocal.get(item.decisionRef) ?? null)
        : null;

    const lesson = await this.lessonRepo.save(
      this.lessonRepo.create({
        orgId,
        problem: String(p.problem ?? ''),
        solution: String(p.solution ?? ''),
        result: (p.result as string | null) ?? null,
        confidence: this.safeFloat(p.confidence, 0.5),
        decisionId,
        source: ContentSource.reflect,
        sourceRef: item.runId,
        createdBy: userId,
      }),
    );

    if (decisionId) {
      await this.links.createEdge(
        orgId,
        LinkNodeType.lesson,
        lesson.id,
        LinkNodeType.decision,
        decisionId,
        LinkRelation.derived_from,
        userId,
      );
    }

    item.status = ExtractionStatus.applied;
    item.materializedId = lesson.id;
    await this.itemRepo.save(item);
  }
}
