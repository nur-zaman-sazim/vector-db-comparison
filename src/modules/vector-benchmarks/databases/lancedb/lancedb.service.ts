import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import * as lancedb from "@lancedb/lancedb";
import {
  Schema,
  Field,
  Float32,
  FixedSizeList,
  Utf8,
  Int32,
} from "apache-arrow";

import {
  VectorDatabaseService,
  BenchmarkDocument,
  SearchResult,
  DatabaseStats,
  MetadataFilter,
} from "../../interfaces/benchmark-result.interface";

@Injectable()
export class LanceDbService implements VectorDatabaseService, OnModuleInit {
  private readonly logger = new Logger(LanceDbService.name);
  private db!: lancedb.Connection;
  private currentTable!: string;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const uri = this.configService.get("LANCEDB_URI", "./data/lancedb");
    this.db = await lancedb.connect(uri);
    this.logger.log("LanceDB connection established");
  }

  async initialize(): Promise<void> {
    // LanceDB doesn't require initialization
    this.logger.log("LanceDB service initialized");
  }

  async createCollection(name: string, dimensions: number): Promise<void> {
    this.currentTable = name;

    // Drop table if exists
    try {
      await this.db.dropTable(name);
    } catch (error) {
      // Table doesn't exist
    }

    // Define explicit schema with proper vector type
    const schema = new Schema([
      new Field("id", new Utf8()),
      new Field("text", new Utf8()),
      new Field(
        "embedding",
        new FixedSizeList(dimensions, new Field("item", new Float32())),
      ),
      new Field("source", new Utf8()),
      new Field("category", new Utf8()),
      new Field("word_count", new Int32()),
    ]);

    // Create empty table with schema
    const table = await this.db.createEmptyTable(name, schema);

    this.logger.log(`Collection "${name}" created with ${dimensions} dimensions`);
  }

  async insertVectors(documents: BenchmarkDocument[]): Promise<void> {
    const table = await this.db.openTable(this.currentTable);
    const batchSize = 1000;

    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);

      const data = batch.map((doc) => ({
        id: doc.id,
        text: doc.text,
        embedding: new Float32Array(doc.embedding),
        source: doc.metadata.source,
        category: doc.metadata.category,
        word_count: doc.metadata.word_count,
      }));

      await table.add(data);

      if ((i + batchSize) % 10000 === 0) {
        this.logger.log(
          `Inserted ${Math.min(i + batchSize, documents.length)}/${documents.length} documents`,
        );
      }
    }

    this.logger.log(`Inserted ${documents.length} vectors successfully`);
  }

  async vectorSearch(query: number[], limit: number): Promise<SearchResult[]> {
    const table = await this.db.openTable(this.currentTable);

    // Convert to Float32Array for LanceDB
    const queryVector = new Float32Array(query);

    const results = await table
      .vectorSearch(queryVector)
      .column("embedding")
      .limit(limit)
      .toArray();

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
          author: "",
          created_at: new Date(),
          word_count: result.word_count,
          tags: [],
        },
      },
    }));
  }

  async filteredSearch(
    query: number[],
    filter: MetadataFilter,
    limit: number,
  ): Promise<SearchResult[]> {
    const table = await this.db.openTable(this.currentTable);

    // Build SQL-like where clause
    const whereClauses: string[] = [];

    if (filter.source) {
      whereClauses.push(`source = '${filter.source}'`);
    }
    if (filter.category) {
      whereClauses.push(`category = '${filter.category}'`);
    }
    if (filter.word_count_min !== undefined) {
      whereClauses.push(`word_count >= ${filter.word_count_min}`);
    }
    if (filter.word_count_max !== undefined) {
      whereClauses.push(`word_count <= ${filter.word_count_max}`);
    }

    const whereClause = whereClauses.join(" AND ");

    // Convert to Float32Array for LanceDB
    const queryVector = new Float32Array(query);

    let search = table.vectorSearch(queryVector).column("embedding").limit(limit);

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
          author: "",
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
    this.logger.log(`Collection "${name}" deleted`);
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
