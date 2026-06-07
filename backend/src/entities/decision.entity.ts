import { Column, Entity, OneToMany } from 'typeorm';
import { ContentBaseEntity } from './content-base.entity';
import { Lesson } from './lesson.entity';

export enum DecisionStatus {
  proposed = 'proposed',
  accepted = 'accepted',
  rejected = 'rejected',
  implemented = 'implemented',
}

/**
 * An organisational decision with its rationale and outcome.
 */
@Entity({ name: 'decisions' })
export class Decision extends ContentBaseEntity {
  @Column({ type: 'varchar', length: 512 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'text', nullable: true })
  outcome: string | null;

  @Column({ type: 'varchar', length: 16, default: DecisionStatus.proposed })
  status: DecisionStatus;

  @OneToMany(() => Lesson, (lesson) => lesson.decision, {
    cascade: true,
  })
  lessons: Lesson[];

  toDict(): Record<string, unknown> {
    return {
      id: this.id,
      org_id: this.orgId,
      title: this.title,
      description: this.description,
      reason: this.reason,
      outcome: this.outcome,
      status: this.status,
      ...this.provenanceDict(),
      created_at: this.createdAt ? this.createdAt.toISOString() : null,
      updated_at: this.updatedAt ? this.updatedAt.toISOString() : null,
    };
  }
}
