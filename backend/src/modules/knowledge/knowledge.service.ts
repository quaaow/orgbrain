import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Knowledge, KnowledgeType } from '../../entities/knowledge.entity';
import { ContentSource } from '../../entities/content-base.entity';
import { EmbeddingsService } from '../../core/embeddings/embeddings.service';
import { QdrantService } from '../../core/qdrant/qdrant.service';
import {
  CreateKnowledgeDto,
  ListKnowledgeQueryDto,
  ReviewKnowledgeDto,
  SearchKnowledgeDto,
  UpdateKnowledgeDto,
} from './dto/knowledge.dto';

/** Default days until freshly created knowledge should be re-reviewed. */
const DEFAULT_REVIEW_DAYS = 180;

@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);

  constructor(
    @InjectRepository(Knowledge)
    private readonly repo: Repository<Knowledge>,
    private readonly embeddings: EmbeddingsService,
    private readonly qdrant: QdrantService,
  ) {}

  private payload(item: Knowledge): Record<string, unknown> {
    return {
      org_id: item.orgId,
      type: item.type,
      title: item.title,
      content: item.content,
      source_id: item.id,
    };
  }

  private async getOr404(id: string, orgId: string): Promise<Knowledge> {
    const item = await this.repo.findOne({ where: { id, orgId } });
    if (!item) {
      throw new NotFoundException('Knowledge not found');
    }
    return item;
  }

  async create(dto: CreateKnowledgeDto, orgId: string, userId: string | null) {
    const id = uuidv4();
    const item = this.repo.create({
      id,
      orgId,
      type: dto.type,
      title: dto.title,
      content: dto.content,
      importance: dto.importance ?? 0.5,
      embeddingId: id,
      source: ContentSource.manual,
      createdBy: userId,
      reviewDueAt: new Date(
        Date.now() + DEFAULT_REVIEW_DAYS * 24 * 60 * 60 * 1000,
      ),
    });

    const vector = await this.embeddings.createEmbedding(item.content);
    try {
      await this.qdrant.upsert(id, vector, this.payload(item));
    } catch (error) {
      this.logger.error(`Qdrant upsert failed: ${(error as Error).message}`);
      throw new InternalServerErrorException(
        `Vector store error: ${(error as Error).message}`,
      );
    }

    await this.repo.save(item);
    return item.toDict();
  }

  async list(orgId: string, query: ListKnowledgeQueryDto) {
    const items = await this.repo.find({
      where: {
        orgId,
        ...(query.type ? { type: query.type } : {}),
      },
      order: { createdAt: 'DESC' },
      take: query.limit,
      skip: query.offset,
    });
    return items.map((i) => i.toDict());
  }

  /** Knowledge whose review date has passed (needs re-validation). */
  async listStale(orgId: string, limit: number, offset: number) {
    const items = await this.repo
      .createQueryBuilder('k')
      .where('k.org_id = :orgId', { orgId })
      .andWhere('k.review_due_at IS NOT NULL')
      .andWhere('k.review_due_at < NOW()')
      .orderBy('k.review_due_at', 'ASC')
      .take(limit)
      .skip(offset)
      .getMany();
    return items.map((i) => i.toDict());
  }

  /** Mark knowledge as freshly reviewed and schedule the next review. */
  async markReviewed(id: string, orgId: string, dto: ReviewKnowledgeDto) {
    const item = await this.getOr404(id, orgId);
    const intervalDays = dto.interval_days ?? DEFAULT_REVIEW_DAYS;
    const now = new Date();
    item.reviewedAt = now;
    item.reviewDueAt = new Date(
      now.getTime() + intervalDays * 24 * 60 * 60 * 1000,
    );
    await this.repo.save(item);
    return item.toDict();
  }

  async search(dto: SearchKnowledgeDto, orgId: string) {
    const vector = await this.embeddings.createEmbedding(dto.query);
    let hits;
    try {
      hits = await this.qdrant.search(
        vector,
        dto.top_k,
        QdrantService.orgFilter(orgId),
      );
    } catch (error) {
      this.logger.error(`Qdrant search failed: ${(error as Error).message}`);
      throw new InternalServerErrorException(
        `Vector store error: ${(error as Error).message}`,
      );
    }

    return hits.map((h) => ({
      id: String(h.id),
      score: h.score,
      payload: h.payload ?? {},
    }));
  }

  async get(id: string, orgId: string) {
    const item = await this.getOr404(id, orgId);
    return item.toDict();
  }

  async update(id: string, dto: UpdateKnowledgeDto, orgId: string) {
    const item = await this.getOr404(id, orgId);

    const updates = Object.entries(dto).filter(([, v]) => v !== undefined);
    for (const [field, value] of updates) {
      (item as unknown as Record<string, unknown>)[field] = value;
    }

    const touchedIndex = dto.content !== undefined || dto.title !== undefined;
    if (touchedIndex) {
      const vector = await this.embeddings.createEmbedding(item.content);
      try {
        await this.qdrant.upsert(item.id, vector, this.payload(item));
      } catch (error) {
        this.logger.error(
          `Qdrant upsert failed during update: ${(error as Error).message}`,
        );
        throw new InternalServerErrorException(
          `Vector store error: ${(error as Error).message}`,
        );
      }
    }

    await this.repo.save(item);
    return item.toDict();
  }

  async remove(id: string, orgId: string): Promise<void> {
    const item = await this.getOr404(id, orgId);

    if (item.embeddingId) {
      try {
        await this.qdrant.delete(item.embeddingId);
      } catch (error) {
        this.logger.error(`Qdrant delete failed: ${(error as Error).message}`);
        throw new InternalServerErrorException(
          `Vector store error: ${(error as Error).message}`,
        );
      }
    }

    await this.repo.remove(item);
  }
}

export { KnowledgeType };
