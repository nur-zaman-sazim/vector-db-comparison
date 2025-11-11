import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';
import {
  VectorDatabaseService,
  BenchmarkDocument,
  SearchResult,
  DatabaseStats,
  MetadataFilter,
} from '../../interfaces/benchmark-result.interface';

interface QdrantFilter {
  key: string;
  match?: { value: string };
  range?: { gte?: number; lte?: number };
}

@Injectable()
export class QdrantService implements VectorDatabaseService, OnModuleInit {
  private readonly logger = new Logger(QdrantService.name);
  private client!: QdrantClient;
  private currentCollection!: string;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const url = this.configService.get('QDRANT_URL', 'http://localhost:6333');
    const apiKey = this.configService.get('QDRANT_API_KEY');

    this.client = new QdrantClient({
      url,
      apiKey,
    });

    this.logger.log('Qdrant connection established');
  }

  async initialize(): Promise<void> {
    // Qdrant doesn't require initialization
    this.logger.log('Qdrant service initialized');
  }

  async createCollection(name: string, dimensions: number): Promise<void> {
    this.currentCollection = name;

    // Delete collection if exists
    try {
      await this.client.deleteCollection(name);
    } catch (error) {
      // Collection doesn't exist
    }

    // Create collection
    await this.client.createCollection(name, {
      vectors: {
        size: dimensions,
        distance: 'Cosine',
        on_disk: false, // In-memory for best performance
      },
      optimizers_config: {
        indexing_threshold: 20000,
        memmap_threshold: 50000,
      },
      hnsw_config: {
        m: 16,
        ef_construct: 100,
        full_scan_threshold: 10000,
        on_disk: false,
      },
    });

    // Create payload indexes for filterable HNSW
    await this.client.createPayloadIndex(name, {
      field_name: 'source',
      field_schema: 'keyword',
    });

    await this.client.createPayloadIndex(name, {
      field_name: 'category',
      field_schema: 'keyword',
    });

    await this.client.createPayloadIndex(name, {
      field_name: 'word_count',
      field_schema: 'integer',
    });

    this.logger.log(`Collection "${name}" created with ${dimensions} dimensions and payload indexes`);
  }

  async insertVectors(documents: BenchmarkDocument[]): Promise<void> {
    const batchSize = 1000;

    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);

      const points = batch.map((doc) => ({
        id: doc.id,
        vector: doc.embedding,
        payload: {
          text: doc.text,
          source: doc.metadata.source,
          category: doc.metadata.category,
          author: doc.metadata.author,
          created_at: doc.metadata.created_at.toISOString(),
          word_count: doc.metadata.word_count,
          tags: doc.metadata.tags,
        },
      }));

      await this.client.upsert(this.currentCollection, {
        wait: true,
        points,
      });

      if ((i + batchSize) % 10000 === 0) {
        this.logger.log(
          `Inserted ${Math.min(i + batchSize, documents.length)}/${documents.length} documents`,
        );
      }
    }

    this.logger.log(`Inserted ${documents.length} vectors successfully`);
  }

  async vectorSearch(query: number[], limit: number): Promise<SearchResult[]> {
    const result = await this.client.search(this.currentCollection, {
      vector: query,
      limit,
      with_payload: true,
      with_vector: false,
    });

    return result.map((point) => ({
      id: point.id as string,
      score: point.score,
      document: {
        id: point.id as string,
        text: (point.payload?.text as string) || '',
        embedding: [],
        metadata: {
          source: (point.payload?.source as string) || '',
          category: (point.payload?.category as string) || '',
          author: (point.payload?.author as string) || '',
          created_at: new Date(point.payload?.created_at as string),
          word_count: (point.payload?.word_count as number) || 0,
          tags: (point.payload?.tags as string[]) || [],
        },
      },
    }));
  }

  async filteredSearch(query: number[], filter: MetadataFilter, limit: number): Promise<SearchResult[]> {
    // Build Qdrant filter
    const must: QdrantFilter[] = [];

    if (filter.source) {
      must.push({ key: 'source', match: { value: filter.source } });
    }
    if (filter.category) {
      must.push({ key: 'category', match: { value: filter.category } });
    }
    if (filter.word_count_min !== undefined) {
      must.push({ key: 'word_count', range: { gte: filter.word_count_min } });
    }
    if (filter.word_count_max !== undefined) {
      must.push({ key: 'word_count', range: { lte: filter.word_count_max } });
    }

    const qdrantFilter = must.length > 0 ? { must } : undefined;

    const result = await this.client.search(this.currentCollection, {
      vector: query,
      filter: qdrantFilter,
      limit,
      with_payload: true,
      with_vector: false,
    });

    return result.map((point) => ({
      id: point.id as string,
      score: point.score,
      document: {
        id: point.id as string,
        text: (point.payload?.text as string) || '',
        embedding: [],
        metadata: {
          source: (point.payload?.source as string) || '',
          category: (point.payload?.category as string) || '',
          author: (point.payload?.author as string) || '',
          created_at: new Date(point.payload?.created_at as string),
          word_count: (point.payload?.word_count as number) || 0,
          tags: (point.payload?.tags as string[]) || [],
        },
      },
    }));
  }

  async hybridSearch(
    queryVector: number[],
    queryText: string,
    limit: number,
  ): Promise<SearchResult[]> {
    // Simplified - full hybrid search would require sparse vectors
    return this.vectorSearch(queryVector, limit);
  }

  async deleteCollection(name: string): Promise<void> {
    await this.client.deleteCollection(name);
    this.logger.log(`Collection "${name}" deleted`);
  }

  async getStats(): Promise<DatabaseStats> {
    const info = await this.client.getCollection(this.currentCollection);

    return {
      vectorCount: info.points_count || 0,
      indexSize: 0,
      memoryUsage: 0,
    };
  }
}
