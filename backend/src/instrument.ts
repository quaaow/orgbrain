import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import * as Sentry from '@sentry/nestjs';

// Loaded before the Nest app boots (and before @nestjs/config), so we read the
// environment directly. In production the platform injects these vars; locally
// dotenv fills them in from backend/.env.
loadEnv();

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
