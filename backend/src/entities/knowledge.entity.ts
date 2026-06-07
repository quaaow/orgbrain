import { Column, Entity, Index } from 'typeorm';
import { ContentBaseEntity } from './content-base.entity';

export enum KnowledgeType {
  fact = 'fact',
  document = 'document',
  note = 'note',
  policy = 'policy',
}

/**
 * A single piece of organisational knowledge.
 *
 * `embeddingId` holds the corresponding point ID in the Qdrant collection.
 */
@Entity({ name: 'knowledge' })
@Index('ix_knowledge_org_type', ['orgId', 'type'])
export class Knowledge extends ContentBaseEntity {
  @Column({ type: 'varchar', length: 16 })
  type: KnowledgeType;

  @Column({ type: 'varchar', length: 512 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'float', default: 0.5 })
  importance: number;

  @Column({ name: 'embedding_id', type: 'varchar', length: 36, nullable: true })
  embeddingId: string | null;

  toDict(): Record<string, unknown> {
    return {
      id: this.id,
      org_id: this.orgId,
      type: this.type,
      title: this.title,
      content: this.content,
      importance: this.importance,
      embedding_id: this.embeddingId,
      ...this.provenanceDict(),
      created_at: this.createdAt ? this.createdAt.toISOString() : null,
      updated_at: this.updatedAt ? this.updatedAt.toISOString() : null,
    };
  }
}
