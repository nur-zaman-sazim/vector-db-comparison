import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as lancedb from '@lancedb/lancedb';
import {
  VectorDatabaseService,
  BenchmarkDocument,
  SearchResult,
  DatabaseStats,
} from '../../interfaces/benchmark-result.interface';

@Injectable()
export class LanceDbService implements VectorDatabaseService, OnModuleInit {
  private db!: lancedb.Connection;
  private currentTable!: string;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const uri = this.configService.get('LANCEDB_URI', './data/lancedb');
    this.db = await lancedb.connect(uri);
    console.log('LanceDB connection established');
  }

  async initialize(): Promise<void> {
    // LanceDB doesn't require initialization
  }

  async createCollection(name: string, dimensions: number): Promise<void> {
    this.currentTable = name;

    // Drop table if exists
    try {
      await this.db.dropTable(name);
    } catch (error) {
      // Table doesn't exist
    }

    // Create table with first document (LanceDB infers schema)
    const dummyDoc = {
      id: 'dummy',
      text: 'dummy',
      embedding: new Array(dimensions).fill(0),
      source: '',
      category: '',
      word_count: 0,
    };

    const table = await this.db.createTable(name, [dummyDoc]);

    // Delete dummy document
    await table.delete('id = "dummy"');

    // Create vector index
    // LanceDB will automatically create an appropriate index for the vector column
  }

  async insertVectors(documents: BenchmarkDocument[]): Promise<void> {
    const table = await this.db.openTable(this.currentTable);
    const batchSize = 1000;

    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);

      const data = batch.map((doc) => ({
        id: doc.id,
        text: doc.text,
        embedding: doc.embedding,
        source: doc.metadata.source,
        category: doc.metadata.category,
        word_count: doc.metadata.word_count,
      }));

      await table.add(data);

      if ((i + batchSize) % 10000 === 0) {
        console.log(
          `Inserted ${Math.min(i + batchSize, documents.length)}/${documents.length} documents`,
        );
      }
    }
  }

  async vectorSearch(query: number[], limit: number): Promise<SearchResult[]> {
    const table = await this.db.openTable(this.currentTable);

    const results = await table.vectorSearch(query).limit(limit).toArray();

    return results.map((result) => ({
      id: result.id,
      score: 1 - (result._distance || 0), // Convert distance to similarity
      document: {
        id: result.id,
        text: result.text,
        embedding: [],
        metadata: {
          source: result.source,
          category: result.category,
          author: '',
          created_at: new Date(),
          word_count: result.word_count,
          tags: [],
        },
      },
    }));
  }

  async filteredSearch(query: number[], filter: any, limit: number): Promise<SearchResult[]> {
    const table = await this.db.openTable(this.currentTable);

    // Build SQL-like where clause
    const whereClauses: string[] = [];

    if (filter.source) {
      whereClauses.push(`source = '${filter.source}'`);
    }
    if (filter.category) {
      whereClauses.push(`category = '${filter.category}'`);
    }
    if (filter.word_count_min) {
      whereClauses.push(`word_count >= ${filter.word_count_min}`);
    }
    if (filter.word_count_max) {
      whereClauses.push(`word_count <= ${filter.word_count_max}`);
    }

    const whereClause = whereClauses.join(' AND ');

    let search = table.vectorSearch(query).limit(limit);

    if (whereClause) {
      search = search.where(whereClause);
    }

    const results = await search.toArray();

    return results.map((result) => ({
      id: result.id,
      score: 1 - (result._distance || 0),
      document: {
        id: result.id,
        text: result.text,
        embedding: [],
        metadata: {
          source: result.source,
          category: result.category,
          author: '',
          created_at: new Date(),
          word_count: result.word_count,
          tags: [],
        },
      },
    }));
  }

  async hybridSearch(
    queryVector: number[],
    queryText: string,
    limit: number,
  ): Promise<SearchResult[]> {
    // Simplified - full hybrid search would use LanceDB's FTS
    return this.vectorSearch(queryVector, limit);
  }

  async deleteCollection(name: string): Promise<void> {
    await this.db.dropTable(name);
  }

  async getStats(): Promise<DatabaseStats> {
    const table = await this.db.openTable(this.currentTable);
    const count = await table.countRows();

    return {
      vectorCount: count,
      indexSize: 0,
      memoryUsage: 0,
    };
  }
}
