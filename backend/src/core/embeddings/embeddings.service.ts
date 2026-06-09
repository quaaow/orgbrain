import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

export const EMBEDDING_MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';
export const EMBEDDING_DIM = 384;

type FeatureExtractionPipeline = (
  texts: string | string[],
  options: { pooling: 'mean'; normalize: boolean },
) => Promise<{ tolist(): number[][] }>;

/**
 * Local text embeddings via Transformers.js (all-MiniLM-L6-v2).
 *
 * Produces normalised 384-dimensional vectors. The model is loaded lazily on
 * first use and reused for all subsequent calls.
 */
@Injectable()
export class EmbeddingsService implements OnModuleInit {
  private readonly logger = new Logger(EmbeddingsService.name);
  private pipelinePromise: Promise<FeatureExtractionPipeline> | null = null;

  async onModuleInit() {
    // Warm-up the model so the first real request doesn't block the event loop.
    try {
      this.logger.log('Pre-loading embedding model…');
      await this.createEmbedding('warm-up');
      this.logger.log('Embedding model ready');
    } catch (err) {
      this.logger.error(
        `Failed to pre-load embedding model: ${(err as Error).message}`,
      );
    }
  }

  private getPipeline(): Promise<FeatureExtractionPipeline> {
    if (!this.pipelinePromise) {
      this.logger.log(`Loading embedding model '${EMBEDDING_MODEL_NAME}'...`);
      // @xenova/transformers is ESM-only; load it via dynamic import.
      this.pipelinePromise = import('@xenova/transformers').then(
        async ({ pipeline }) => {
          const extractor = (await pipeline(
            'feature-extraction',
            EMBEDDING_MODEL_NAME,
          )) as unknown as FeatureExtractionPipeline;
          this.logger.log(`Embedding model loaded (dim=${EMBEDDING_DIM})`);
          return extractor;
        },
      );
    }
    return this.pipelinePromise;
  }

  private zeroVector(): number[] {
    return new Array<number>(EMBEDDING_DIM).fill(0);
  }

  /**
   * Return a normalised 384-dim embedding for a single text string.
   * Returns a zero vector for empty or whitespace-only input.
   */
  async createEmbedding(text: string): Promise<number[]> {
    if (!text || !text.trim()) {
      this.logger.debug('createEmbedding received empty text — zero vector');
      return this.zeroVector();
    }

    const extractor = await this.getPipeline();
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    return output.tolist()[0];
  }

  /**
   * Return normalised 384-dim embeddings for a batch of texts.
   * Empty or whitespace-only strings are replaced with zero vectors.
   */
  async createEmbeddingsBatch(texts: string[]): Promise<number[][]> {
    if (!texts || texts.length === 0) {
      return [];
    }

    const results: number[][] = new Array(texts.length);
    const nonEmptyIndices: number[] = [];
    const nonEmptyTexts: string[] = [];

    texts.forEach((text, i) => {
      if (text && text.trim()) {
        nonEmptyIndices.push(i);
        nonEmptyTexts.push(text);
      } else {
        results[i] = this.zeroVector();
      }
    });

    if (nonEmptyTexts.length > 0) {
      const extractor = await this.getPipeline();
      const output = await extractor(nonEmptyTexts, {
        pooling: 'mean',
        normalize: true,
      });
      const vectors = output.tolist();
      nonEmptyIndices.forEach((idx, j) => {
        results[idx] = vectors[j];
      });
    }

    return results;
  }
}
