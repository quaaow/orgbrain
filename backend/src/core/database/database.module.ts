import { join } from 'path';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigService } from '../../config/app-config.service';
import { AppConfigModule } from '../../config/config.module';
import { entities } from '../../entities';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        type: 'postgres',
        url: config.databaseUrl,
        entities,
        // Migrations are the source of truth in production; `synchronize`
        // remains on only for local development convenience.
        migrations: [join(__dirname, '..', '..', 'migrations', '*.{js,ts}')],
        migrationsRun: config.isProduction,
        synchronize: !config.isProduction,
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
      }),
    }),
  ],
})
export class DatabaseModule {}
