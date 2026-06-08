import 'reflect-metadata';
import * as Sentry from '@sentry/nestjs';

// Runs before the Nest app boots (and before @nestjs/config), so we read the
// environment directly. In production the platform injects these vars and
// dotenv isn't installed (dev-only dependency); locally it fills them in from
// backend/.env. The require is therefore optional and failures are ignored.
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  (require('dotenv') as typeof import('dotenv')).config();
} catch {
  // dotenv absent in production — env is already populated by the platform.
}

const dsn = process.env.SENTRY_DSN;

// Sentry stays completely inert unless a DSN is provided, so local development
// and CI never ship events.
if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.APP_ENV ?? 'development',
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
    // Knowledge/decisions can be sensitive; never auto-attach request bodies,
    // headers, cookies or IPs. We attach a minimal, explicit context instead.
    sendDefaultPii: false,
  });
}
