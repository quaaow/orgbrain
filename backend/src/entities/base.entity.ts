import {
  CreateDateColumn,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Column,
} from 'typeorm';

/**
 * Abstract base providing a UUID primary key, timestamps and a multi-tenant
 * `org_id` index shared by every table.
 */
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Index()
  @Column({ name: 'org_id', type: 'varchar', length: 36 })
  orgId: string;
}
