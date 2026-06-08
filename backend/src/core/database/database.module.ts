import { join } from 'path';
import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigService } from '../../config/app-config.service';
import { AppConfigModule } from '../../config/config.module';
import { entities } from '../../entities';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => {
        const synchronize = config.dbSynchronize;
        if (synchronize) {
          const host = (() => {
            try {
              return new URL(config.databaseUrl).host;
            } catch {
              return 'unknown';
            }
          })();
          // Loud warning: schema auto-sync is destructive against shared DBs.
          new Logger('DatabaseModule').warn(
            `DB_SYNCHRONIZE is ON — TypeORM will auto-create/alter the schema on ${host}. Only do this against a throwaway dev database.`,
          );
        }
        return {
          type: 'postgres' as const,
          url: config.databaseUrl,
          entities,
          // Migrations are the production source of truth; auto-sync is an
          // explicit, non-production-only opt-in (see AppConfigService).
          migrations: [join(__dirname, '..', '..', 'migrations', '*.{js,ts}')],
          migrationsRun: config.isProduction,
          synchronize,
          logging: !config.isProduction,
          // Supabase uses a self-signed cert in the chain; encrypt without
          // strict verification (only cert-pinning is off).
          ssl: config.databaseRequiresSsl
            ? { rejectUnauthorized: false }
            : false,
          // PgBouncer (Supabase pooler) does not support named prepared
          // statements; keep the connection pool conservative.
          extra: config.isPooler
            ? { max: 10, ssl: { rejectUnauthorized: false } }
            : { max: 15 },
        };
      },
    }),
  ],
})
export class DatabaseModule {}
