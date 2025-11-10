import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient } from 'pg';
import pgvector from 'pgvector/pg';
import {
  VectorDatabaseService,
  BenchmarkDocument,
  SearchResult,
  DatabaseStats,
  MetadataFilter,
} from '../../interfaces/benchmark-result.interface';

@Injectable()
export class PgVectorService
  implements VectorDatabaseService, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PgVectorService.name);
  private pool: Pool;
  private currentCollection: string;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    // Use existing DATABASE_URL from the application
    const databaseUrl = this.configService.get<string>('DATABASE_URL');

    this.pool = new Pool({
      connectionString: databaseUrl,
      max: 20,
    });

    await pgvector.registerType(this.pool);
    this.logger.log('PGVector connection established using DATABASE_URL');
  }

  async onModuleDestroy() {
    await this.pool.end();
    this.logger.log('PGVector connection closed');
  }

  async initialize(): Promise<void> {
    await this.pool.query('CREATE EXTENSION IF NOT EXISTS vector');
    this.logger.log('Vector extension initialized');
  }

  async createCollection(name: string, dimensions: number): Promise<void> {
    this.currentCollection = name;

    // Drop table if exists
    await this.pool.query(`DROP TABLE IF EXISTS ${name}`);

    // Create table
    await this.pool.query(`
      CREATE TABLE ${name} (
        id TEXT PRIMARY KEY,
        text TEXT NOT NULL,
        embedding vector(${dimensions}),
        metadata JSONB,
        source TEXT,
        category TEXT,
        created_at TIMESTAMP,
        word_count INTEGER
      )
    `);

    // Create indexes for metadata filtering
    await this.pool.query(`CREATE INDEX ON ${name} USING GIN (metadata)`);
    await this.pool.query(`CREATE INDEX ON ${name}(source)`);
    await this.pool.query(`CREATE INDEX ON ${name}(category)`);

    this.logger.log(`Collection "${name}" created with ${dimensions} dimensions`);
  }

  async createVectorIndex(indexType: 'hnsw' | 'ivfflat' = 'hnsw'): Promise<void> {
    const tableName = this.currentCollection;

    if (indexType === 'hnsw') {
      await this.pool.query(`
        CREATE INDEX ON ${tableName}
        USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 64)
      `);
      this.logger.log('HNSW index created');
    } else {
      await this.pool.query(`
        CREATE INDEX ON ${tableName}
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100)
      `);
      this.logger.log('IVFFlat index created');
    }
  }

  async insertVectors(documents: BenchmarkDocument[]): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const batchSize = 1000;
      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);
        const values = batch
          .map((doc, idx) => {
            const base = idx * 8;
            return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8})`;
          })
          .join(',');

        const params = batch.flatMap((doc) => [
          doc.id,
          doc.text,
          pgvector.toSql(doc.embedding),
          JSON.stringify(doc.metadata),
          doc.metadata.source,
          doc.metadata.category,
          doc.metadata.created_at,
          doc.metadata.word_count,
        ]);

        await client.query(
          `INSERT INTO ${this.currentCollection}
           (id, text, embedding, metadata, source, category, created_at, word_count)
           VALUES ${values}`,
          params,
        );

        if ((i + batchSize) % 10000 === 0) {
          this.logger.log(
            `Inserted ${Math.min(i + batchSize, documents.length)}/${documents.length} documents`,
          );
        }
      }

      await client.query('COMMIT');
      this.logger.log(`Inserted ${documents.length} vectors successfully`);
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error(`Insert failed: ${error.message}`);
      throw error;
    } finally {
      client.release();
    }
  }

  async vectorSearch(query: number[], limit: number): Promise<SearchResult[]> {
    const client = await this.pool.connect();
    try {
      // Set ef_search dynamically based on limit
      const efSearch = Math.max(limit * 2, 100);
      await client.query(`SET hnsw.ef_search = ${efSearch}`);

      const result = await client.query(
        `SELECT id, text, metadata, embedding <=> $1 AS distance
         FROM ${this.currentCollection}
         ORDER BY embedding <=> $1
         LIMIT $2`,
        [pgvector.toSql(query), limit],
      );

      return result.rows.map((row) => ({
        id: row.id,
        score: 1 - row.distance, // Convert distance to similarity score
        document: {
          id: row.id,
          text: row.text,
          embedding: [], // Don't return embedding to save memory
          metadata: row.metadata,
        },
      }));
    } finally {
      client.release();
    }
  }

  async filteredSearch(
    query: number[],
    filter: MetadataFilter,
    limit: number,
  ): Promise<SearchResult[]> {
    const client = await this.pool.connect();
    try {
      const efSearch = Math.max(limit * 2, 100);
      await client.query(`SET hnsw.ef_search = ${efSearch}`);

      // Build WHERE clause from filter
      const whereClauses: string[] = [];
      const params: (string | number | Date)[] = [pgvector.toSql(query)];
      let paramIndex = 2;

      if (filter.source) {
        whereClauses.push(`source = $${paramIndex}`);
        params.push(filter.source);
        paramIndex++;
      }

      if (filter.category) {
        whereClauses.push(`category = $${paramIndex}`);
        params.push(filter.category);
        paramIndex++;
      }

      if (filter.word_count_min !== undefined) {
        whereClauses.push(`word_count >= $${paramIndex}`);
        params.push(filter.word_count_min);
        paramIndex++;
      }

      if (filter.word_count_max !== undefined) {
        whereClauses.push(`word_count <= $${paramIndex}`);
        params.push(filter.word_count_max);
        paramIndex++;
      }

      if (filter.created_after) {
        whereClauses.push(`created_at >= $${paramIndex}`);
        params.push(filter.created_after);
        paramIndex++;
      }

      if (filter.created_before) {
        whereClauses.push(`created_at <= $${paramIndex}`);
        params.push(filter.created_before);
        paramIndex++;
      }

      const whereClause =
        whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
      params.push(limit);

      const result = await client.query(
        `SELECT id, text, metadata, embedding <=> $1 AS distance
         FROM ${this.currentCollection}
         ${whereClause}
         ORDER BY embedding <=> $1
         LIMIT $${paramIndex}`,
        params,
      );

      return result.rows.map((row) => ({
        id: row.id,
        score: 1 - row.distance,
        document: {
          id: row.id,
          text: row.text,
          embedding: [],
          metadata: row.metadata,
        },
      }));
    } finally {
      client.release();
    }
  }

  async hybridSearch(
    queryVector: number[],
    queryText: string,
    limit: number,
    alpha: number = 0.5,
  ): Promise<SearchResult[]> {
    // Simplified hybrid search using RRF
    // In production, you'd add full-text search with tsvector
    const vectorResults = await this.vectorSearch(queryVector, 50);

    // For now, just return vector results
    // Full text search would be added here using PostgreSQL's tsvector
    return vectorResults.slice(0, limit);
  }

  async deleteCollection(name: string): Promise<void> {
    await this.pool.query(`DROP TABLE IF EXISTS ${name}`);
    this.logger.log(`Collection "${name}" deleted`);
  }

  async getStats(): Promise<DatabaseStats> {
    const result = await this.pool.query(
      `
      SELECT
        COUNT(*) as vector_count,
        pg_total_relation_size($1) as index_size
      FROM ${this.currentCollection}
    `,
      [this.currentCollection],
    );

    return {
      vectorCount: parseInt(result.rows[0].vector_count),
      indexSize: parseInt(result.rows[0].index_size),
      memoryUsage: 0, // Would need to query pg_stat_activity for detailed memory stats
    };
  }
}
