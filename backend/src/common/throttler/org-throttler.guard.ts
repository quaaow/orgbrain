import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Rate-limits per organisation rather than globally, so one noisy org cannot
 * exhaust the shared limit for everyone. Falls back to the client IP for
 * unauthenticated / org-less requests (e.g. `/health`, `/auth/me`).
 */
@Injectable()
export class OrgThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const orgId =
      req.headers?.['x-org-id'] ||
      req.orgContext?.orgId ||
      req.query?.org_id;
    if (orgId) {
      return `org:${String(orgId)}`;
    }
    const ip =
      req.ips?.length > 0 ? req.ips[0] : (req.ip as string | undefined);
    return `ip:${ip ?? 'unknown'}`;
  }
}
