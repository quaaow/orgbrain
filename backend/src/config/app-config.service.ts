import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from './configuration';

/**
 * Typed accessor over the validated application configuration.
 *
 * Mirrors the Python `Settings` object, including the convenience
 * `isProduction` flag and the Supabase-aware database connection helpers.
 */
@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  get supabaseUrl(): string {
    return this.config.get('supabaseUrl', { infer: true });
  }

  get supabaseKey(): string {
    return this.config.get('supabaseKey', { infer: true });
  }

  /** Expected issuer of Supabase-signed access tokens. */
  get supabaseJwtIssuer(): string {
    return `${this.supabaseUrl.replace(/\/$/, '')}/auth/v1`;
  }

  /** Discovery URL for Supabase's public JWT signing keys (JWKS, ES256). */
  get supabaseJwksUrl(): string {
    return `${this.supabaseUrl.replace(/\/$/, '')}/auth/v1/.well-known/jwks.json`;
  }

  get databaseUrl(): string {
    return this.config.get('databaseUrl', { infer: true });
  }

  get qdrantUrl(): string {
    return this.config.get('qdrantUrl', { infer: true });
  }

  get qdrantApiKey(): string {
    return this.config.get('qdrantApiKey', { infer: true });
  }

  get openrouterApiKey(): string {
    return this.config.get('openrouterApiKey', { infer: true });
  }

  get chatModel(): string {
    return this.config.get('chatModel', { infer: true });
  }

  get embeddingModel(): string {
    return this.config.get('embeddingModel', { infer: true });
  }

  get appEnv(): string {
    return this.config.get('appEnv', { infer: true });
  }

  get secretKey(): string {
    return this.config.get('secretKey', { infer: true });
  }

  get port(): number {
    return this.config.get('port', { infer: true });
  }

  get isProduction(): boolean {
    return this.appEnv === 'production';
  }

  /**
   * Whether the configured database is the Supabase connection pooler.
   * The pooler (PgBouncer) requires SSL and disabled prepared statements.
   */
  get isPooler(): boolean {
    return this.databaseUrl.includes('pooler.supabase.com');
  }

  /**
   * Whether SSL should be negotiated for the database connection.
   * Supabase always requires SSL; so does any production deployment.
   */
  get databaseRequiresSsl(): boolean {
    return this.databaseUrl.includes('supabase.com') || this.isProduction;
  }
}
