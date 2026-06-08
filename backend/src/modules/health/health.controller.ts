import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Public } from '../../auth/decorators/public.decorator';
import { QdrantService } from '../../core/qdrant/qdrant.service';
import { LlmService } from '../../core/llm/llm.service';

@ApiTags('system')
@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly qdrant: QdrantService,
    private readonly llm: LlmService,
  ) {}

  /** Liveness probe — fast, no external dependencies. */
  @Public()
  @Get()
  health() {
    return { status: 'ok' };
  }

  /**
   * Readiness probe — checks the database, vector store and LLM gateway.
   * Returns 200 with per-dependency booleans; consumers decide how to react.
   */
  @Public()
  @Get('deep')
  async deepHealth() {
    const [postgres, qdrant, openrouter] = await Promise.all([
      this.checkPostgres(),
      this.qdrant.healthCheck(),
      this.llm.healthCheck(),
    ]);
    const dependencies = { postgres, qdrant, openrouter };
    const ok = Object.values(dependencies).every(Boolean);
    return { status: ok ? 'ok' : 'degraded', dependencies };
  }

  private async checkPostgres(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}
