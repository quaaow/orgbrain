import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import {
  EntityLink,
  LinkNodeType,
  LinkRelation,
} from '../../entities/entity-link.entity';
import { Knowledge } from '../../entities/knowledge.entity';
import { Decision } from '../../entities/decision.entity';
import { Lesson } from '../../entities/lesson.entity';
import { CreateLinkDto, ListLinksQueryDto } from './dto/link.dto';

const GRAPH_NODE_LIMIT = 500;

@Injectable()
export class LinksService {
  constructor(
    @InjectRepository(EntityLink)
    private readonly links: Repository<EntityLink>,
    @InjectRepository(Knowledge)
    private readonly knowledge: Repository<Knowledge>,
    @InjectRepository(Decision)
    private readonly decisions: Repository<Decision>,
    @InjectRepository(Lesson)
    private readonly lessons: Repository<Lesson>,
  ) {}

  private repoFor(
    type: LinkNodeType,
  ): Repository<{ id: string; orgId: string }> {
    type NodeRepo = Repository<{ id: string; orgId: string }>;
    switch (type) {
      case LinkNodeType.knowledge:
        return this.knowledge as unknown as NodeRepo;
      case LinkNodeType.decision:
        return this.decisions as unknown as NodeRepo;
      case LinkNodeType.lesson:
        return this.lessons as unknown as NodeRepo;
      default:
        throw new BadRequestException(`Unknown node type: ${String(type)}`);
    }
  }

  private async assertNodeExists(
    type: LinkNodeType,
    id: string,
    orgId: string,
  ): Promise<void> {
    const exists = await this.repoFor(type).exists({ where: { id, orgId } });
    if (!exists) {
      throw new NotFoundException(`${type} ${id} not found in this organisation`);
    }
  }

  /**
   * Idempotently create an edge. Used by both the controller and the reflect
   * pipeline; silently returns the existing edge on a duplicate.
   */
  async createEdge(
    orgId: string,
    sourceType: LinkNodeType,
    sourceId: string,
    targetType: LinkNodeType,
    targetId: string,
    relation: LinkRelation,
    createdBy: string | null,
  ): Promise<EntityLink> {
    const existing = await this.links.findOne({
      where: { orgId, sourceType, sourceId, targetType, targetId, relation },
    });
    if (existing) {
      return existing;
    }
    const edge = this.links.create({
      orgId,
      sourceType,
      sourceId,
      targetType,
      targetId,
      relation,
      createdBy,
    });
    return this.links.save(edge);
  }

  async create(dto: CreateLinkDto, orgId: string, userId: string | null) {
    if (dto.source_type === dto.target_type && dto.source_id === dto.target_id) {
      throw new BadRequestException('A node cannot link to itself');
    }
    await Promise.all([
      this.assertNodeExists(dto.source_type, dto.source_id, orgId),
      this.assertNodeExists(dto.target_type, dto.target_id, orgId),
    ]);
    const edge = await this.createEdge(
      orgId,
      dto.source_type,
      dto.source_id,
      dto.target_type,
      dto.target_id,
      dto.relation,
      userId,
    );
    return edge.toDict();
  }

  async list(orgId: string, query: ListLinksQueryDto) {
    const qb = this.links
      .createQueryBuilder('l')
      .where('l.org_id = :orgId', { orgId });

    if (query.node_type && query.node_id) {
      qb.andWhere(
        new Brackets((b) => {
          b.where(
            '(l.source_type = :t AND l.source_id = :id)',
            { t: query.node_type, id: query.node_id },
          ).orWhere('(l.target_type = :t AND l.target_id = :id)', {
            t: query.node_type,
            id: query.node_id,
          });
        }),
      );
    }

    const edges = await qb.orderBy('l.created_at', 'DESC').take(1000).getMany();
    return edges.map((e) => e.toDict());
  }

  async remove(id: string, orgId: string): Promise<void> {
    const edge = await this.links.findOne({ where: { id, orgId } });
    if (!edge) {
      throw new NotFoundException('Link not found');
    }
    await this.links.remove(edge);
  }

  /** Build a node + edge graph for visualisation. */
  async graph(orgId: string) {
    const [knowledge, decisions, lessons, edges] = await Promise.all([
      this.knowledge.find({
        where: { orgId },
        order: { createdAt: 'DESC' },
        take: GRAPH_NODE_LIMIT,
      }),
      this.decisions.find({
        where: { orgId },
        order: { createdAt: 'DESC' },
        take: GRAPH_NODE_LIMIT,
      }),
      this.lessons.find({
        where: { orgId },
        order: { createdAt: 'DESC' },
        take: GRAPH_NODE_LIMIT,
      }),
      this.links.find({
        where: { orgId },
        order: { createdAt: 'DESC' },
        take: 2000,
      }),
    ]);

    const nodes = [
      ...knowledge.map((k) => ({
        id: k.id,
        type: LinkNodeType.knowledge,
        label: k.title,
        subtype: k.type,
        content: k.content.slice(0, 300),
      })),
      ...decisions.map((d) => ({
        id: d.id,
        type: LinkNodeType.decision,
        label: d.title,
        subtype: d.status,
        content: `${d.reason.slice(0, 200)}${d.outcome ? ` → ${d.outcome.slice(0, 200)}` : ''}`,
      })),
      ...lessons.map((l) => ({
        id: l.id,
        type: LinkNodeType.lesson,
        label: l.problem.slice(0, 120),
        subtype: null,
        content: l.solution ? l.solution.slice(0, 300) : l.problem.slice(0, 300),
      })),
    ];

    return {
      nodes,
      edges: edges.map((e) => ({
        id: e.id,
        source: e.sourceId,
        source_type: e.sourceType,
        target: e.targetId,
        target_type: e.targetType,
        relation: e.relation,
      })),
      counts: {
        nodes: nodes.length,
        edges: edges.length,
      },
    };
  }
}
