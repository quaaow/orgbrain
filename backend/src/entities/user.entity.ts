import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * A global application user, provisioned from the Supabase Auth token.
 *
 * `id` mirrors the Supabase `auth.users` UUID (the JWT `sub` claim), so
 * passwords/credentials are owned entirely by Supabase — never stored here.
 */
@Entity({ name: 'users' })
export class User {
  @PrimaryColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 320 })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  toDict(): Record<string, unknown> {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      created_at: this.createdAt ? this.createdAt.toISOString() : null,
    };
  }
}
