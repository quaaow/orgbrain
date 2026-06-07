import { Column, Entity } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum ReflectionRunStatus {
  /** Extracted, awaiting human review. */
  pending = 'pending',
  /** All approved items were materialised. */
  applied = 'applied',
  /** Some items materialised, others rejected/duplicate. */
  partial = 'partial',
  /** Discarded without materialising anything. */
  discarded = 'discarded',
}

export interface ReflectionCounts {
  facts: number;
  decisions: number;
  lessons: number;
  duplicates: number;
}

/**
 * A single `/reflect` invocation. Holds the staged extraction so a human can
 * review it before anything is written into the knowledge base.
 */
@Entity({ name: 'reflection_runs' })
export class ReflectionRun extends BaseEntity {
  @Column({ type: 'varchar', length: 16, default: ReflectionRunStatus.pending })
  status: ReflectionRunStatus;

  @Column({ name: 'input_chars', type: 'int', default: 0 })
  inputChars: number;

  @Column({ name: 'chunk_count', type: 'int', default: 1 })
  chunkCount: number;

  @Column({ type: 'varchar', length: 128, nullable: true })
  model: string | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;

  @Column({ type: 'jsonb', nullable: true })
  counts: ReflectionCounts | null;

  toDict(): Record<string, unknown> {
    return {
      id: this.id,
      org_id: this.orgId,
      status: this.status,
      input_chars: this.inputChars,
      chunk_count: this.chunkCount,
      model: this.model,
      created_by: this.createdBy,
      counts: this.counts,
      created_at: this.createdAt ? this.createdAt.toISOString() : null,
      updated_at: this.updatedAt ? this.updatedAt.toISOString() : null,
    };
  }
}
