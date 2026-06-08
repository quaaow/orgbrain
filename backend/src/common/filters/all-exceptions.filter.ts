import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { Request, Response } from 'express';

interface AuthedRequest extends Request {
  orgContext?: { orgId?: string };
  user?: { userId?: string; sub?: string };
}

interface ErrorBody {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
}

/**
 * Catches every unhandled exception and returns a consistent, sanitised JSON
 * body. Known `HttpException`s keep their status and message; anything else is
 * logged with its stack and reported as a generic 500 so internal details
 * (stack traces, driver errors) never leak to clients.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<AuthedRequest>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = 'Internal Server Error';
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (res && typeof res === 'object') {
        const body = res as Record<string, unknown>;
        message = (body.message as string | string[]) ?? exception.message;
        error = (body.error as string) ?? error;
      }
      if (error === 'Internal Server Error') {
        error = exception.name.replace(/Exception$/, '');
      }
    } else {
      // Unknown/unexpected error: log full detail server-side, hide from client.
      const err = exception as Error;
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}: ${err?.message}`,
        err?.stack,
      );
    }

    // Report genuine server-side failures (unhandled errors and 5xx) to Sentry
    // with a minimal, explicit context. Expected 4xx (validation, auth, quota)
    // are intentionally left out to keep the signal clean. No-op without a DSN.
    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      Sentry.withScope((scope) => {
        const userId = request.user?.userId ?? request.user?.sub;
        const orgId = request.orgContext?.orgId;
        if (userId) scope.setUser({ id: userId });
        if (orgId) scope.setTag('org_id', orgId);
        scope.setContext('request', {
          method: request.method,
          path: request.url,
        });
        Sentry.captureException(exception);
      });
    }

    const body: ErrorBody = {
      statusCode,
      error,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(statusCode).json(body);
  }
}
