import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import { validate as isUuid } from 'uuid';
import { AppConfigService } from '../../config/app-config.service';

export const COLLECTION_NAME = 'orgbrain_knowledge';
export const VECTOR_DIM = 384;
const DISTANCE = 'Cosine';

export type QdrantFilter = Record<string, unknown>;

export interface ScoredPoint {
  id: string | number;
  score: number;
  payload: Record<string, unknown> | null;
}

/**
 * Qdrant vector store client for semantic search.
 *
 * Collection: 'orgbrain_knowledge', 384-dim cosine vectors.
 * The collection is created on application startup if it does not exist.
 */
@Injectable()
export class QdrantService implements OnModuleInit {
  private readonly logger = new Logger(QdrantService.name);
  private client: QdrantClient | null = null;

  constructor(private readonly config: AppConfigService) {}

  private getClient(): QdrantClient {
    if (!this.client) {
      this.client = new QdrantClient({
        url: this.config.qdrantUrl,
        apiKey: this.config.qdrantApiKey,
      });
    }
    return this.client;
  }

  /** Ensure the collection exists. Called once on application startup. */
  async onModuleInit(): Promise<void> {
    const client = this.getClient();
    try {
      const { exists } = await client.collectionExists(COLLECTION_NAME);
      if (!exists) {
        await client.createCollection(COLLECTION_NAME, {
          vectors: { size: VECTOR_DIM, distance: DISTANCE },
        });
        this.logger.log(`Qdrant collection '${COLLECTION_NAME}' created`);
      } else {
        this.logger.log(
          `Qdrant collection '${COLLECTION_NAME}' already exists`,
        );
      }

      // Filtering by org_id requires a keyword payload index. Creating an
      // already-existing index is a no-op, so this is safe on every startup.
      await client.createPayloadIndex(COLLECTION_NAME, {
        field_name: 'org_id',
        field_schema: 'keyword',
        wait: true,
      });
      this.logger.log("Qdrant payload index on 'org_id' ensured");
    } catch (error) {
      this.logger.error(
        `Failed to initialise Qdrant collection: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /** Qdrant accepts UUID strings or unsigned ints as point IDs. */
  private toPointId(id: string): string | number {
    if (isUuid(id)) {
      return id;
    }
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash * 31 + id.charCodeAt(i)) % Number.MAX_SAFE_INTEGER;
    }
    return Math.abs(hash);
  }

  /** Insert or update a single vector with its payload. */
  async upsert(
    id: string,
    vector: number[],
    payload: Record<string, unknown>,
  ): Promise<void> {
    const client = this.getClient();
    await client.upsert(COLLECTION_NAME, {
      wait: true,
      points: [{ id: this.toPointId(id), vector, payload }],
    });
    this.logger.debug(`Upserted point id=${id}`);
  }

  /** Return the top-k most similar points to the query vector. */
  async search(
    vector: number[],
    topK = 10,
    filter?: QdrantFilter,
  ): Promise<ScoredPoint[]> {
    const client = this.getClient();
    const response = await client.query(COLLECTION_NAME, {
      query: vector,
      limit: topK,
      filter,
      with_payload: true,
    });
    return response.points as ScoredPoint[];
  }

  /** Remove a point from the collection by ID. */
  async delete(id: string): Promise<void> {
    const client = this.getClient();
    await client.delete(COLLECTION_NAME, {
      wait: true,
      points: [this.toPointId(id)],
    });
    this.logger.debug(`Deleted point id=${id}`);
  }

  /** Build an org-scoped equality filter. */
  static orgFilter(orgId: string): QdrantFilter {
    return { must: [{ key: 'org_id', match: { value: orgId } }] };
  }
}
