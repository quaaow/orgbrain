import { Injectable, Logger } from '@nestjs/common';
import { KnowledgeService, KnowledgeType } from '../knowledge/knowledge.service';
import { DecisionService } from '../decision/decision.service';
import { DecisionStatus } from '../../entities/decision.entity';
import { LessonService } from '../lesson/lesson.service';
import { LinksService } from '../links/links.service';
import { LinkNodeType, LinkRelation } from '../../entities/entity-link.entity';

const DEMO_KNOWLEDGE = [
  {
    type: KnowledgeType.fact,
    title: 'Company Vision',
    content:
      'OrgBrain exists to eliminate organisational amnesia. Every decision, lesson and fact should be discoverable in seconds, not lost in chat history or forgotten when people leave.',
    importance: 0.9,
  },
  {
    type: KnowledgeType.policy,
    title: 'Engineering Guidelines',
    content:
      'All new backend services are written in TypeScript with NestJS. PostgreSQL is the default datastore. Vector search uses Qdrant. Changes must include tests and documentation updates.',
    importance: 0.8,
  },
  {
    type: KnowledgeType.document,
    title: 'Q3 Product Goals',
    content:
      '1. Launch semantic search with hybrid reranking. 2. Ship the Reflect pipeline for automated knowledge extraction. 3. Onboard 100 active organisations. 4. Release public API with key-based auth.',
    importance: 0.7,
  },
];

const DEMO_DECISIONS = [
  {
    title: 'Adopt PostgreSQL as the primary datastore',
    description: 'Evaluated during the platform rebuild in March.',
    reason:
      'Strong relational guarantees, team familiarity, and excellent TypeORM support. Row-level security gives us tenant isolation out of the box.',
    outcome: 'Migrated in two weeks with zero data loss.',
    status: DecisionStatus.accepted,
  },
  {
    title: 'Switch to Qdrant for vector search',
    description: 'Replaced pgvector after latency tests.',
    reason:
      'Self-hostable, fast filtered search, and native REST API. Pgvector struggled with concurrent filtered queries at our target scale.',
    outcome: 'Query latency dropped from 800 ms to ~50 ms.',
    status: DecisionStatus.implemented,
  },
];

const DEMO_LESSON = {
  problem: 'Embedding model cold start after each deploy',
  solution:
    'Pre-load the Xenova/MiniLM model inside a NestJS onModuleInit hook and cache it in a module-level variable.',
  result: 'Cold start reduced from ~15 s to ~2 s.',
  confidence: 0.9,
};

@Injectable()
export class DemoSeedService {
  private readonly logger = new Logger(DemoSeedService.name);

  constructor(
    private readonly knowledge: KnowledgeService,
    private readonly decisions: DecisionService,
    private readonly lessons: LessonService,
    private readonly links: LinksService,
  ) {}

  async seed(orgId: string, userId: string | null): Promise<void> {
    this.logger.log(`Seeding demo data for org ${orgId}`);

    try {
      const knowledgeIds: string[] = [];
      for (const k of DEMO_KNOWLEDGE) {
        const created = await this.knowledge.create(
          { type: k.type, title: k.title, content: k.content, importance: k.importance },
          orgId,
          userId,
        );
        knowledgeIds.push(String(created.id));
      }

      const decisionIds: string[] = [];
      for (const d of DEMO_DECISIONS) {
        const created = await this.decisions.create(
          {
            title: d.title,
            description: d.description,
            reason: d.reason,
            outcome: d.outcome,
            status: d.status,
          },
          orgId,
          userId,
        );
        decisionIds.push(String(created.id));
      }

      const lesson = await this.lessons.create(
        {
          problem: DEMO_LESSON.problem,
          solution: DEMO_LESSON.solution,
          result: DEMO_LESSON.result,
          confidence: DEMO_LESSON.confidence,
          decision_id: decisionIds[1],
        },
        orgId,
        userId,
      );

      // Link lesson to the decision it stems from
      await this.links.createEdge(
        orgId,
        LinkNodeType.lesson,
        String(lesson.id),
        LinkNodeType.decision,
        decisionIds[1],
        LinkRelation.derived_from,
        userId,
      );

      // Link a knowledge item to a decision
      await this.links.createEdge(
        orgId,
        LinkNodeType.knowledge,
        knowledgeIds[1], // Engineering Guidelines
        LinkNodeType.decision,
        decisionIds[0], // Adopt PostgreSQL
        LinkRelation.relates_to,
        userId,
      );

      this.logger.log(`Demo seed complete for org ${orgId}`);
    } catch (error) {
      this.logger.error(
        `Demo seed failed for org ${orgId}: ${(error as Error).message}`,
      );
      // Non-fatal: org is still usable even if seed fails
    }
  }
}
