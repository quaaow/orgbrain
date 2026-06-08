import * as Sentry from '@sentry/nextjs';

// Server-side init (Node runtime). Stays inert unless a DSN is configured.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_APP_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
});
