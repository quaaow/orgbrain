import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { withSentryConfig } from '@sentry/nextjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin the tracing root to this app to avoid picking up unrelated lockfiles.
  outputFileTracingRoot: __dirname,
};

// Wrap with Sentry. Source-map upload only runs when SENTRY_AUTH_TOKEN (plus
// org/project) is present in the build environment; otherwise it's skipped.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  // Tunnel browser events through the app to dodge ad-blockers (optional).
  tunnelRoute: '/monitoring',
});
