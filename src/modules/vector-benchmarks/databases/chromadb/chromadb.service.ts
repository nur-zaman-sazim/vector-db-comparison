import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChromaClient, Collection } from 'chromadb';
import {
  VectorDatabaseService,
  BenchmarkDocument,
  SearchResult,
  DatabaseStats,
} from '../../interfaces/benchmark-result.interface';

@Injectable()
export class ChromaDbService implements VectorDatabaseService, OnModuleInit {
  private client!: ChromaClient;
  private collection!: Collection;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const url = this.configService.get('CHROMADB_URL', 'http://localhost:8000');
    this.client = new ChromaClient({ path: url });
    console.log('ChromaDB connection established');
  }

  async initialize(): Promise<void> {
    // ChromaDB doesn't require initialization
  }

  async createCollection(name: string, dimensions: number): Promise<void> {
    try {
      await this.client.deleteCollection({ name });
    } catch (error) {
      // Collection doesn't exist, that's fine
    }

    this.collection = await this.client.createCollection({
      name,
      metadata: {
        'hnsw:space': 'cosine',
        'hnsw:construction_ef': 100,
        'hnsw:search_ef': 100,
        'hnsw:M': 16,
      },
    });
  }

  async insertVectors(documents: BenchmarkDocument[]): Promise<void> {
    const batchSize = 1000;

    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);

      await this.collection.add({
        ids: batch.map((doc) => doc.id),
        embeddings: batch.map((doc) => doc.embedding),
        metadatas: batch.map((doc) => doc.metadata as any),
        documents: batch.map((doc) => doc.text),
      });

      if ((i + batchSize) % 10000 === 0) {
        console.log(
          `Inserted ${Math.min(i + batchSize, documents.length)}/${documents.length} documents`,
        );
      }
    }
  }

  async vectorSearch(query: number[], limit: number): Promise<SearchResult[]> {
    const result = await this.collection.query({
      queryEmbeddings: [query],
      nResults: limit,
    });

    return result.ids[0].map((id, idx) => ({
      id: id as string,
      score: 1 - (result.distances?.[0]?.[idx] || 0),
      document: {
        id: id as string,
        text: (result.documents?.[0]?.[idx] as string) || '',
        embedding: [],
        metadata: result.metadatas?.[0]?.[idx] as any,
      },
    }));
  }

  async filteredSearch(query: number[], filter: any, limit: number): Promise<SearchResult[]> {
    const result = await this.collection.query({
      queryEmbeddings: [query],
      nResults: limit,
      where: filter,
    });

    return result.ids[0].map((id, idx) => ({
      id: id as string,
      score: 1 - (result.distances?.[0]?.[idx] || 0),
      document: {
        id: id as string,
        text: (result.documents?.[0]?.[idx] as string) || '',
        embedding: [],
        metadata: result.metadatas?.[0]?.[idx] as any,
      },
    }));
  }

  async hybridSearch(
    queryVector: number[],
    queryText: string,
    limit: number,
  ): Promise<SearchResult[]> {
    // ChromaDB doesn't have built-in hybrid search
    // Fall back to vector search
    return this.vectorSearch(queryVector, limit);
  }

  async deleteCollection(name: string): Promise<void> {
    await this.client.deleteCollection({ name });
  }

  async getStats(): Promise<DatabaseStats> {
    const count = await this.collection.count();
    return {
      vectorCount: count,
      indexSize: 0, // Not exposed by ChromaDB
      memoryUsage: 0, // Not exposed by ChromaDB
    };
  }
}
