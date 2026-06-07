import { Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

/** Where a piece of content originated. */
export enum ContentSource {
  manual = 'manual',
  reflect = 'reflect',
  import = 'import',
}

/**
 * Base class for user-facing knowledge content (knowledge, decisions, lessons).
 *
 * Adds provenance (who/where it came from) and a lightweight review cycle so
 * that knowledge can be flagged as stale and re-validated over time.
 */
export abstract class ContentBaseEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 16, default: ContentSource.manual })
  source: ContentSource;

  /** Free-form origin reference: reflection run id, external URL, etc. */
  @Column({ name: 'source_ref', type: 'varchar', length: 256, nullable: true })
  sourceRef: string | null;

  /** Supabase user id of the author, when known. */
  @Index()
  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;

  /** Last time a human confirmed this content is still accurate. */
  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt: Date | null;

  /** When the content should next be reviewed; past this date it is stale. */
  @Column({ name: 'review_due_at', type: 'timestamptz', nullable: true })
  reviewDueAt: Date | null;

  /** True when the review due date has passed. */
  isStale(now: Date = new Date()): boolean {
    return (
      this.reviewDueAt != null && this.reviewDueAt.getTime() < now.getTime()
    );
  }

  protected provenanceDict(): Record<string, unknown> {
    return {
      source: this.source,
      source_ref: this.sourceRef,
      created_by: this.createdBy,
      reviewed_at: this.reviewedAt ? this.reviewedAt.toISOString() : null,
      review_due_at: this.reviewDueAt ? this.reviewDueAt.toISOString() : null,
      stale: this.isStale(),
    };
  }
}
