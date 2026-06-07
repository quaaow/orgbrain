import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Organization } from './organization.entity';

/** Role within an organisation, ordered from least to most privileged. */
export enum Role {
  viewer = 'viewer',
  member = 'member',
  admin = 'admin',
  owner = 'owner',
}

/** Numeric rank used for role comparisons (higher = more privileged). */
export const ROLE_RANK: Record<Role, number> = {
  [Role.viewer]: 1,
  [Role.member]: 2,
  [Role.admin]: 3,
  [Role.owner]: 4,
};

/** Join row linking a user to an organisation with a role. */
@Entity({ name: 'memberships' })
@Unique('uq_membership_user_org', ['userId', 'organizationId'])
export class Membership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Index()
  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @Column({ type: 'varchar', length: 16, default: Role.member })
  role: Role;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
