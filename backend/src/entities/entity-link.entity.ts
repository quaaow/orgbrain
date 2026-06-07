import { Column, Entity, Index, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';

/** The kind of node an edge connects. */
export enum LinkNodeType {
  knowledge = 'knowledge',
  decision = 'decision',
  lesson = 'lesson',
}

/** The semantic relation an edge represents. */
export enum LinkRelation {
  relates_to = 'relates_to',
  derived_from = 'derived_from',
  supersedes = 'supersedes',
  caused_by = 'caused_by',
  addresses = 'addresses',
  duplicate_of = 'duplicate_of',
}

/**
 * A directed edge in the organisational knowledge graph, connecting any two
 * content nodes (knowledge / decision / lesson) with a typed relation.
 */
@Entity({ name: 'entity_links' })
@Unique('uq_entity_link', [
  'orgId',
  'sourceType',
  'sourceId',
  'targetType',
  'targetId',
  'relation',
])
export class EntityLink extends BaseEntity {
  @Index()
  @Column({ name: 'source_type', type: 'varchar', length: 16 })
  sourceType: LinkNodeType;

  @Index()
  @Column({ name: 'source_id', type: 'uuid' })
  sourceId: string;

  @Index()
  @Column({ name: 'target_type', type: 'varchar', length: 16 })
  targetType: LinkNodeType;

  @Index()
  @Column({ name: 'target_id', type: 'uuid' })
  targetId: string;

  @Column({ type: 'varchar', length: 32 })
  relation: LinkRelation;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;

  toDict(): Record<string, unknown> {
    return {
      id: this.id,
      org_id: this.orgId,
      source_type: this.sourceType,
      source_id: this.sourceId,
      target_type: this.targetType,
      target_id: this.targetId,
      relation: this.relation,
      created_by: this.createdBy,
      created_at: this.createdAt ? this.createdAt.toISOString() : null,
    };
  }
}
