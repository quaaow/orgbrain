import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './core/database/database.module';
import { EmbeddingsModule } from './core/embeddings/embeddings.module';
import { LlmModule } from './core/llm/llm.module';
import { QdrantModule } from './core/qdrant/qdrant.module';
import { AuthModule } from './auth/auth.module';
import { AuditModule } from './common/audit/audit.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { DecisionModule } from './modules/decision/decision.module';
import { LessonModule } from './modules/lesson/lesson.module';
import { ContextModule } from './modules/context/context.module';
import { ReflectionModule } from './modules/reflection/reflection.module';
import { LinksModule } from './modules/links/links.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    EmbeddingsModule,
    LlmModule,
    QdrantModule,
    AuthModule,
    AuditModule,
    OrganizationsModule,
    KnowledgeModule,
    DecisionModule,
    LessonModule,
    ContextModule,
    ReflectionModule,
    LinksModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
