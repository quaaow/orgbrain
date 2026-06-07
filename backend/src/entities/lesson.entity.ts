import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ContentBaseEntity } from './content-base.entity';
import { Decision } from './decision.entity';

/**
 * A lesson learned, optionally linked to a Decision.
 */
@Entity({ name: 'lessons' })
export class Lesson extends ContentBaseEntity {
  @Column({ type: 'text' })
  problem: string;

  @Column({ type: 'text' })
  solution: string;

  @Column({ type: 'text', nullable: true })
  result: string | null;

  @Column({ type: 'float', default: 0.5 })
  confidence: number;

  @Index()
  @Column({ name: 'decision_id', type: 'uuid', nullable: true })
  decisionId: string | null;

  @ManyToOne(() => Decision, (decision) => decision.lessons, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'decision_id' })
  decision: Decision | null;

  toDict(includeDecision = false): Record<string, unknown> {
    const data: Record<string, unknown> = {
      id: this.id,
      org_id: this.orgId,
      problem: this.problem,
      solution: this.solution,
      result: this.result,
      confidence: this.confidence,
      decision_id: this.decisionId,
      ...this.provenanceDict(),
      created_at: this.createdAt ? this.createdAt.toISOString() : null,
      updated_at: this.updatedAt ? this.updatedAt.toISOString() : null,
    };
    if (includeDecision && this.decision) {
      data.decision = this.decision.toDict();
    }
    return data;
  }
}
