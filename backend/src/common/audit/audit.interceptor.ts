import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** Records every successful mutating request to the audit log. */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    if (!MUTATING_METHODS.has(request.method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        void this.audit.record({
          organizationId: request.orgContext?.orgId ?? null,
          userId: request.user?.userId ?? null,
          method: request.method,
          path: request.route?.path ?? request.url,
          statusCode: response.statusCode,
          metadata: {
            params: request.params ?? {},
            query: request.query ?? {},
          },
        });
      }),
    );
  }
}
