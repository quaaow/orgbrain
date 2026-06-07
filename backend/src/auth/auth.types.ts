import { Role } from '../entities/membership.entity';

/** Authenticated principal extracted from the verified Supabase JWT. */
export interface AuthUser {
  userId: string;
  email: string | null;
}

/** Resolved organisation scope for the current request. */
export interface OrgContext {
  orgId: string;
  role: Role;
}
