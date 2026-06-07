import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { EmbeddingsService } from '../../core/embeddings/embeddings.service';
import { QdrantService } from '../../core/qdrant/qdrant.service';
import { ContextRequestDto } from './dto/context.dto';

@Injectable()
export class ContextService {
  private readonly logger = new Logger(ContextService.name);

  constructor(
    private readonly embeddings: EmbeddingsService,
    private readonly qdrant: QdrantService,
  ) {}

  async getContext(dto: ContextRequestDto, orgId: string) {
    const vector = await this.embeddings.createEmbedding(dto.query);

    let hits;
    try {
      hits = await this.qdrant.search(
        vector,
        dto.top_k,
        QdrantService.orgFilter(orgId),
      );
    } catch (error) {
      this.logger.error(`Qdrant search failed: ${(error as Error).message}`);
      throw new InternalServerErrorException(
        `Vector store error: ${(error as Error).message}`,
      );
    }

    const results = hits.map((hit) => {
      const payload = hit.payload ?? {};
      return {
        type: String(payload.type ?? 'unknown'),
        title: String(payload.title ?? ''),
        content: String(payload.content ?? ''),
        score: hit.score,
      };
    });

    return { query: dto.query, results };
  }
}
