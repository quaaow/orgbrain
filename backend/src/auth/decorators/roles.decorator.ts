import { SetMetadata } from '@nestjs/common';
import { Role } from '../../entities/membership.entity';

export const ROLES_KEY = 'minRole';

/**
 * Requires the caller to hold at least `min` role within the organisation.
 * Enforced by `RolesGuard` (which must run after `OrgGuard`).
 */
export const Roles = (min: Role) => SetMetadata(ROLES_KEY, min);
