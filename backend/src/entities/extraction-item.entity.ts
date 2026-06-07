import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum ExtractionKind {
  fact = 'fact',
  decision = 'decision',
  lesson = 'lesson',
}

export enum ExtractionStatus {
  /** Awaiting review. */
  pending = 'pending',
  /** Reviewer approved; will be materialised on apply. */
  approved = 'approved',
  /** Reviewer rejected; will be skipped. */
  rejected = 'rejected',
  /** Materialised into a real knowledge/decision/lesson record. */
  applied = 'applied',
  /** Detected as a near-duplicate of existing knowledge. */
  duplicate = 'duplicate',
}

/**
 * One candidate item extracted by `/reflect`, staged for human review before
 * being written into the knowledge base.
 */
@Entity({ name: 'extraction_items' })
@Index('ix_extraction_run', ['runId', 'kind'])
export class ExtractionItem extends BaseEntity {
  @Index()
  @Column({ name: 'run_id', type: 'uuid' })
  runId: string;

  @Column({ type: 'varchar', length: 16 })
  kind: ExtractionKind;

  @Column({ type: 'varchar', length: 16, default: ExtractionStatus.pending })
  status: ExtractionStatus;

  /** Cleaned extracted fields, shape depends on `kind`. */
  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @Column({ type: 'float', default: 0.5 })
  confidence: number;

  /** Ordinal of this item among decisions in the run (decisions only). */
  @Column({ name: 'local_index', type: 'int', nullable: true })
  localIndex: number | null;

  /** For lessons: `localIndex` of the related decision in the same run. */
  @Column({ name: 'decision_ref', type: 'int', nullable: true })
  decisionRef: number | null;

  /** For duplicates: id of the existing knowledge record matched. */
  @Column({ name: 'duplicate_of_id', type: 'uuid', nullable: true })
  duplicateOfId: string | null;

  @Column({ name: 'duplicate_score', type: 'float', nullable: true })
  duplicateScore: number | null;

  /** Set once materialised: id of the created record. */
  @Column({ name: 'materialized_id', type: 'uuid', nullable: true })
  materializedId: string | null;

  toDict(): Record<string, unknown> {
    return {
      id: this.id,
      run_id: this.runId,
      kind: this.kind,
      status: this.status,
      payload: this.payload,
      confidence: this.confidence,
      decision_ref: this.decisionRef,
      duplicate_of_id: this.duplicateOfId,
      duplicate_score: this.duplicateScore,
      materialized_id: this.materializedId,
    };
  }
}
