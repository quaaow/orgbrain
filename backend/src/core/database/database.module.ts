import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigService } from '../../config/app-config.service';
import { AppConfigModule } from '../../config/config.module';
import { Knowledge } from '../../entities/knowledge.entity';
import { Decision } from '../../entities/decision.entity';
import { Lesson } from '../../entities/lesson.entity';
import { User } from '../../entities/user.entity';
import { Organization } from '../../entities/organization.entity';
import { Membership } from '../../entities/membership.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { EntityLink } from '../../entities/entity-link.entity';
import { ReflectionRun } from '../../entities/reflection-run.entity';
import { ExtractionItem } from '../../entities/extraction-item.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        type: 'postgres',
        url: config.databaseUrl,
        entities: [
          Knowledge,
          Decision,
          Lesson,
          User,
          Organization,
          Membership,
          AuditLog,
          EntityLink,
          ReflectionRun,
          ExtractionItem,
        ],
        // Mirrors the Python `Base.metadata.create_all` startup behaviour.
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
