import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/** A tenant. All knowledge/decisions/lessons are scoped to an organisation. */
@Entity({ name: 'organizations' })
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  toDict(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      created_at: this.createdAt ? this.createdAt.toISOString() : null,
    };
  }
}
