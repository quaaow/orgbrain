import { Knowledge } from './knowledge.entity';
import { Decision } from './decision.entity';
import { Lesson } from './lesson.entity';
import { User } from './user.entity';
import { Organization } from './organization.entity';
import { Membership } from './membership.entity';
import { AuditLog } from './audit-log.entity';
import { EntityLink } from './entity-link.entity';
import { ReflectionRun } from './reflection-run.entity';
import { ExtractionItem } from './extraction-item.entity';

/**
 * Single source of truth for the set of persistent entities, shared by the
 * runtime TypeORM connection and the migration CLI data source so the two can
 * never drift apart.
 */
export const entities = [
  Knowledge,
  Decision,
  Lesson,
  User,
  Organization,
  Membership,
  AuditLog,
  EntityLink,
  ReflectionRun,
  ExtractionItem,
];
