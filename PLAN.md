# Vector Database Benchmarking Implementation Plan

## Executive Summary

This document outlines a comprehensive benchmarking implementation for five vector databases: **PGVector**, **ChromaDB**, **Milvus**, **Qdrant**, and **LanceDB**. Each phase implements one database with standardized testing methodology to enable apples-to-apples comparison across key metrics: query latency (P50/P99), throughput (QPS), hybrid search performance, memory efficiency, indexing speed, and operational complexity.

## Objectives

1. **Validate benchmark claims** from the research report with reproducible tests
2. **Provide practical guidance** for Node.js/TypeScript developers choosing vector databases
3. **Test at multiple scales**: 100K, 1M, 10M, and 50M vectors (where feasible)
4. **Measure real-world RAG patterns**: vector search, hybrid search, metadata filtering, reranking
5. **Capture operational metrics**: setup complexity, monitoring, resource consumption

## Project Structure

Following the existing NestJS conventions in this codebase:

```
src/
├── modules/
│   ├── vector-benchmarks/          # Main benchmark module
│   │   ├── vector-benchmarks.module.ts
│   │   ├── vector-benchmarks.controller.ts
│   │   ├── vector-benchmarks.service.ts
│   │   ├── vector-benchmarks.dtos.ts
│   │   ├── vector-benchmarks.constants.ts
│   │   ├── vector-benchmarks.enums.ts
│   │   ├── interfaces/
│   │   │   └── benchmark-result.interface.ts
│   │   ├── databases/                # Database implementations
│   │   │   ├── pgvector/
│   │   │   │   ├── pgvector.module.ts
│   │   │   │   ├── pgvector.service.ts
│   │   │   │   ├── pgvector.config.ts
│   │   │   │   └── pgvector.repository.ts
│   │   │   ├── chromadb/
│   │   │   │   ├── chromadb.module.ts
│   │   │   │   ├── chromadb.service.ts
│   │   │   │   └── chromadb.config.ts
│   │   │   ├── milvus/
│   │   │   │   ├── milvus.module.ts
│   │   │   │   ├── milvus.service.ts
│   │   │   │   └── milvus.config.ts
│   │   │   ├── qdrant/
│   │   │   │   ├── qdrant.module.ts
│   │   │   │   ├── qdrant.service.ts
│   │   │   │   └── qdrant.config.ts
│   │   │   └── lancedb/
│   │   │       ├── lancedb.module.ts
│   │   │       ├── lancedb.service.ts
│   │   │       └── lancedb.config.ts
│   │   ├── benchmarks/               # Benchmark test implementations
│   │   │   ├── latency.benchmark.ts
│   │   │   ├── throughput.benchmark.ts
│   │   │   ├── hybrid-search.benchmark.ts
│   │   │   ├── filtering.benchmark.ts
│   │   │   ├── indexing.benchmark.ts
│   │   │   └── concurrent-load.benchmark.ts
│   │   ├── data-generators/          # Test data generation
│   │   │   ├── embedding-generator.service.ts
│   │   │   ├── dataset-loader.service.ts
│   │   │   └── query-generator.service.ts
│   │   ├── reporters/                # Results reporting
│   │   │   ├── console-reporter.service.ts
│   │   │   ├── json-reporter.service.ts
│   │   │   ├── csv-reporter.service.ts
│   │   │   └── markdown-reporter.service.ts
│   │   └── __tests__/
│   │       ├── vector-benchmarks.service.spec.ts
│   │       └── databases/
│   │           ├── pgvector.service.spec.ts
│   │           ├── chromadb.service.spec.ts
│   │           ├── milvus.service.spec.ts
│   │           ├── qdrant.service.spec.ts
│   │           └── lancedb.service.spec.ts
│   └── documents/                    # Document entity for benchmarking
│       ├── documents.module.ts
│       ├── documents.entity.ts
│       └── documents.repository.ts
├── common/
│   └── interfaces/
│       └── environment-variables.interface.ts  # Add vector DB env vars
└── db/
    └── migrations/
        └── Migration*_add_vector_benchmarks.ts
```

## Benchmarking Methodology

### Test Environment

**Hardware Assumptions**:

- Multi-core CPU (actual cores will be detected at runtime)
- Sufficient RAM for vector operations (will be measured)
- SSD storage
- Docker support for database containers

**Software Stack**:

- Node.js v20 (already configured)
- TypeScript
- NestJS (existing framework)
- MikroORM (for PGVector integration)
- Docker Compose (for database containers)
- Vitest (for testing)

### Standard Test Dataset

**Document Schema**:

```typescript
export interface BenchmarkDocument {
  id: string;
  text: string;
  embedding: number[]; // 1536-dim (OpenAI) or 768-dim (Sentence Transformers)
  metadata: {
    source: string;
    category: string;
    author: string;
    created_at: Date;
    word_count: number;
    tags: string[];
  };
}
```

**Dataset Sizes**: 100K, 1M, 10M, 50M vectors
**Embedding Dimensions**: 1536 (OpenAI), 768 (Sentence Transformers)

### Core Benchmark Tests

All benchmarks will be implemented as services following NestJS patterns:

#### Test 1: Vector Similarity Search

- Pure cosine similarity / L2 distance
- Top-K: 10, 50, 100
- Recall Target: 95%, 99%
- Metrics: P50/P99 latency, QPS (1/10/100 concurrent clients)

#### Test 2: Metadata Filtering

- Filter Selectivity: 1%, 10%, 50%, 90%
- Single condition, range filter, multi-condition
- Metrics: Latency overhead vs baseline, recall degradation

#### Test 3: Hybrid Search

- Vector + BM25 keyword search
- Fusion: RRF, weighted combination
- Alpha weights: [0.3, 0.5, 0.7]
- Metrics: End-to-end latency, result quality (NDCG@10)

#### Test 4: Reranking Pipeline

- Pattern: Retrieve 50 → Rerank to 10
- Metrics: Total pipeline latency, accuracy improvement

#### Test 5: Indexing Performance

- Bulk insert (100K vectors)
- Incremental insert (1K vectors/batch)
- Index rebuild time
- Metrics: Insertion throughput, index build time, memory consumption

#### Test 6: Concurrent Load Testing

- Sustained: 100 QPS for 10 minutes
- Burst: Spike to 500 QPS for 30 seconds
- Mixed: 70% reads, 20% writes, 10% deletes
- Metrics: Latency percentiles under load, error rates

---

## Phase 1: Infrastructure & Common Components

### 1.1 Module Structure Setup

**Create base benchmark module**:

```typescript
// src/modules/vector-benchmarks/vector-benchmarks.module.ts
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { VectorBenchmarksController } from "./vector-benchmarks.controller";
import { VectorBenchmarksService } from "./vector-benchmarks.service";
import { DataGeneratorModule } from "./data-generators/data-generator.module";
import { ReporterModule } from "./reporters/reporter.module";

@Module({
  imports: [ConfigModule, DataGeneratorModule, ReporterModule],
  controllers: [VectorBenchmarksController],
  providers: [VectorBenchmarksService],
  exports: [VectorBenchmarksService],
})
export class VectorBenchmarksModule {}
```

### 1.2 Type Definitions & Interfaces

**Benchmark configuration and results**:

```typescript
// src/modules/vector-benchmarks/interfaces/benchmark-result.interface.ts
export interface BenchmarkConfig {
  database: "pgvector" | "chromadb" | "milvus" | "qdrant" | "lancedb";
  vectorCount: number;
  dimensions: number;
  concurrency: number;
  duration: number; // seconds
  queryType: "similarity" | "filter" | "hybrid";
  topK: number;
  recallTarget: number;
}

export interface BenchmarkResult {
  database: string;
  testName: string;
  timestamp: Date;
  config: BenchmarkConfig;
  metrics: {
    latencyP50: number;
    latencyP90: number;
    latencyP99: number;
    latencyMean: number;
    qps: number;
    recall: number;
    memoryUsedMB: number;
    cpuUtilization: number;
    errors: number;
    totalQueries: number;
  };
}

export interface VectorDatabaseService {
  initialize(): Promise<void>;
  createCollection(name: string, dimensions: number): Promise<void>;
  insertVectors(documents: BenchmarkDocument[]): Promise<void>;
  vectorSearch(query: number[], limit: number): Promise<SearchResult[]>;
  filteredSearch(query: number[], filter: any, limit: number): Promise<SearchResult[]>;
  hybridSearch(queryVector: number[], queryText: string, limit: number): Promise<SearchResult[]>;
  deleteCollection(name: string): Promise<void>;
  getStats(): Promise<DatabaseStats>;
}

export interface SearchResult {
  id: string;
  score: number;
  document?: BenchmarkDocument;
}

export interface DatabaseStats {
  vectorCount: number;
  indexSize: number;
  memoryUsage: number;
}
```

### 1.3 Enums & Constants

```typescript
// src/modules/vector-benchmarks/vector-benchmarks.enums.ts
export enum DatabaseType {
  PGVECTOR = "pgvector",
  CHROMADB = "chromadb",
  MILVUS = "milvus",
  QDRANT = "qdrant",
  LANCEDB = "lancedb",
}

export enum BenchmarkType {
  LATENCY = "latency",
  THROUGHPUT = "throughput",
  HYBRID_SEARCH = "hybrid_search",
  FILTERING = "filtering",
  INDEXING = "indexing",
  CONCURRENT_LOAD = "concurrent_load",
}

// src/modules/vector-benchmarks/vector-benchmarks.constants.ts
export const BENCHMARK_CONSTANTS = {
  DEFAULT_DIMENSIONS: 1536,
  DEFAULT_VECTOR_COUNT: 100000,
  DEFAULT_TOP_K: 10,
  DEFAULT_RECALL_TARGET: 0.99,
  DEFAULT_CONCURRENCY: 10,
  COLLECTION_PREFIX: "benchmark_",
};
```

### 1.4 Data Generation Services

```typescript
// src/modules/vector-benchmarks/data-generators/embedding-generator.service.ts
import { Injectable } from "@nestjs/common";

@Injectable()
export class EmbeddingGeneratorService {
  generateRandomVector(dimensions: number): number[] {
    const vector = new Array(dimensions);
    for (let i = 0; i < dimensions; i++) {
      vector[i] = Math.random() * 2 - 1; // Range: [-1, 1]
    }
    return this.normalize(vector);
  }

  generateRandomVectors(count: number, dimensions: number): number[][] {
    const vectors: number[][] = [];
    for (let i = 0; i < count; i++) {
      vectors.push(this.generateRandomVector(dimensions));
    }
    return vectors;
  }

  private normalize(vector: number[]): number[] {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return vector.map((val) => val / magnitude);
  }
}

// src/modules/vector-benchmarks/data-generators/dataset-loader.service.ts
import { Injectable } from "@nestjs/common";
import { EmbeddingGeneratorService } from "./embedding-generator.service";

@Injectable()
export class DatasetLoaderService {
  constructor(private embeddingGenerator: EmbeddingGeneratorService) {}

  async generateBenchmarkDataset(count: number, dimensions: number): Promise<BenchmarkDocument[]> {
    const documents: BenchmarkDocument[] = [];
    const categories = ["tech", "science", "health", "business", "sports"];
    const sources = ["wikipedia", "arxiv", "stackoverflow", "medium", "blogs"];

    for (let i = 0; i < count; i++) {
      documents.push({
        id: `doc_${i}`,
        text: this.generateRandomText(),
        embedding: this.embeddingGenerator.generateRandomVector(dimensions),
        metadata: {
          source: sources[Math.floor(Math.random() * sources.length)],
          category: categories[Math.floor(Math.random() * categories.length)],
          author: `author_${Math.floor(Math.random() * 100)}`,
          created_at: new Date(),
          word_count: Math.floor(Math.random() * 2000) + 100,
          tags: this.generateRandomTags(),
        },
      });

      // Log progress for large datasets
      if ((i + 1) % 10000 === 0) {
        console.log(`Generated ${i + 1}/${count} documents`);
      }
    }

    return documents;
  }

  private generateRandomText(): string {
    const words = [
      "vector",
      "database",
      "search",
      "embedding",
      "semantic",
      "query",
      "index",
      "performance",
      "benchmark",
      "test",
    ];
    const length = Math.floor(Math.random() * 50) + 10;
    return Array.from({ length }, () => words[Math.floor(Math.random() * words.length)]).join(" ");
  }

  private generateRandomTags(): string[] {
    const allTags = ["ml", "ai", "nlp", "cv", "rag", "llm", "data", "analytics"];
    const count = Math.floor(Math.random() * 3) + 1;
    return Array.from({ length: count }, () => allTags[Math.floor(Math.random() * allTags.length)]);
  }
}
```

### 1.5 Base Benchmark Runner

```typescript
// src/modules/vector-benchmarks/benchmarks/base.benchmark.ts
import { Injectable } from "@nestjs/common";
import { performance } from "perf_hooks";

@Injectable()
export abstract class BaseBenchmark {
  protected calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * percentile) - 1;
    return sorted[Math.max(0, index)];
  }

  protected calculateMean(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  protected async measureLatency<T>(fn: () => Promise<T>): Promise<{ result: T; latency: number }> {
    const start = performance.now();
    const result = await fn();
    const latency = performance.now() - start;
    return { result, latency };
  }

  protected async runConcurrent<T>(tasks: (() => Promise<T>)[], concurrency: number): Promise<T[]> {
    const results: T[] = [];
    for (let i = 0; i < tasks.length; i += concurrency) {
      const batch = tasks.slice(i, i + concurrency);
      const batchResults = await Promise.all(batch.map((task) => task()));
      results.push(...batchResults);
    }
    return results;
  }

  protected getSystemStats(): { cpuUsage: number; memoryUsage: number } {
    const usage = process.cpuUsage();
    const memUsage = process.memoryUsage();

    return {
      cpuUsage: (usage.user + usage.system) / 1000000, // Convert to seconds
      memoryUsage: memUsage.heapUsed / 1024 / 1024, // Convert to MB
    };
  }
}
```

### 1.6 Reporter Services

```typescript
// src/modules/vector-benchmarks/reporters/json-reporter.service.ts
import { Injectable } from "@nestjs/common";
import { writeFile } from "fs/promises";
import { join } from "path";

@Injectable()
export class JsonReporterService {
  async saveResults(results: BenchmarkResult[], filename: string): Promise<void> {
    const outputPath = join(process.cwd(), "benchmark-results", filename);
    await writeFile(outputPath, JSON.stringify(results, null, 2));
    console.log(`Results saved to: ${outputPath}`);
  }

  async loadResults(filename: string): Promise<BenchmarkResult[]> {
    const inputPath = join(process.cwd(), "benchmark-results", filename);
    const data = await readFile(inputPath, "utf-8");
    return JSON.parse(data);
  }
}

// src/modules/vector-benchmarks/reporters/markdown-reporter.service.ts
import { Injectable } from "@nestjs/common";
import { writeFile } from "fs/promises";
import { join } from "path";

@Injectable()
export class MarkdownReporterService {
  async generateReport(results: BenchmarkResult[]): Promise<string> {
    let markdown = "# Vector Database Benchmark Results\n\n";
    markdown += `Generated: ${new Date().toISOString()}\n\n`;

    // Group by database
    const byDatabase = this.groupBy(results, "database");

    for (const [database, dbResults] of Object.entries(byDatabase)) {
      markdown += `## ${database}\n\n`;

      // Group by test type
      const byTest = this.groupBy(dbResults, "testName");

      for (const [testName, testResults] of Object.entries(byTest)) {
        markdown += `### ${testName}\n\n`;
        markdown += this.generateTable(testResults);
        markdown += "\n\n";
      }
    }

    return markdown;
  }

  async saveReport(results: BenchmarkResult[], filename: string): Promise<void> {
    const markdown = await this.generateReport(results);
    const outputPath = join(process.cwd(), "benchmark-results", filename);
    await writeFile(outputPath, markdown);
    console.log(`Report saved to: ${outputPath}`);
  }

  private generateTable(results: BenchmarkResult[]): string {
    let table = "| Vector Count | P50 (ms) | P99 (ms) | QPS | Recall | Memory (MB) |\n";
    table += "|--------------|----------|----------|-----|--------|-------------|\n";

    for (const result of results) {
      table += `| ${result.config.vectorCount} | `;
      table += `${result.metrics.latencyP50.toFixed(2)} | `;
      table += `${result.metrics.latencyP99.toFixed(2)} | `;
      table += `${result.metrics.qps.toFixed(2)} | `;
      table += `${(result.metrics.recall * 100).toFixed(2)}% | `;
      table += `${result.metrics.memoryUsedMB.toFixed(2)} |\n`;
    }

    return table;
  }

  private groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const value = String(item[key]);
      groups[value] = groups[value] || [];
      groups[value].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }
}
```

### 1.7 Environment Variables

Add to `src/common/interfaces/environment-variables.interface.ts`:

```typescript
// Vector Database Configuration
PGVECTOR_HOST?: string;
PGVECTOR_PORT?: number;
PGVECTOR_DATABASE?: string;
PGVECTOR_USER?: string;
PGVECTOR_PASSWORD?: string;

CHROMADB_URL?: string;

MILVUS_HOST?: string;
MILVUS_PORT?: number;

QDRANT_URL?: string;
QDRANT_API_KEY?: string;

LANCEDB_URI?: string;

// Benchmark Configuration
BENCHMARK_VECTOR_COUNT?: number;
BENCHMARK_DIMENSIONS?: number;
BENCHMARK_CONCURRENCY?: number;
```

### 1.8 Docker Compose for Databases

Create `docker-compose.benchmarks.yml`:

```yaml
version: "3.8"

services:
  # PGVector
  pgvector:
    image: pgvector/pgvector:pg16
    container_name: benchmark_pgvector
    environment:
      POSTGRES_DB: benchmark_db
      POSTGRES_USER: benchmark_user
      POSTGRES_PASSWORD: benchmark_pass
    ports:
      - "5433:5432"
    volumes:
      - pgvector_data:/var/lib/postgresql/data
    command:
      - postgres
      - -c
      - shared_buffers=2GB
      - -c
      - effective_cache_size=6GB
      - -c
      - maintenance_work_mem=1GB
      - -c
      - max_parallel_maintenance_workers=4

  # ChromaDB
  chromadb:
    image: chromadb/chroma:latest
    container_name: benchmark_chromadb
    ports:
      - "8000:8000"
    volumes:
      - chromadb_data:/chroma/chroma
    environment:
      ALLOW_RESET: "true"
      ANONYMIZED_TELEMETRY: "false"

  # Qdrant
  qdrant:
    image: qdrant/qdrant:v1.12.0
    container_name: benchmark_qdrant
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrant_data:/qdrant/storage

  # Milvus dependencies
  etcd:
    image: quay.io/coreos/etcd:v3.5.5
    container_name: benchmark_etcd
    environment:
      ETCD_AUTO_COMPACTION_MODE: revision
      ETCD_AUTO_COMPACTION_RETENTION: 1000
      ETCD_QUOTA_BACKEND_BYTES: 4294967296
    volumes:
      - etcd_data:/etcd

  minio:
    image: minio/minio:RELEASE.2023-03-20T20-16-18Z
    container_name: benchmark_minio
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    command: minio server /minio_data --console-address ":9001"
    volumes:
      - minio_data:/minio_data

  milvus:
    image: milvusdb/milvus:v2.5.0
    container_name: benchmark_milvus
    command: ["milvus", "run", "standalone"]
    environment:
      ETCD_ENDPOINTS: etcd:2379
      MINIO_ADDRESS: minio:9000
    ports:
      - "19530:19530"
      - "9091:9091"
    depends_on:
      - etcd
      - minio
    volumes:
      - milvus_data:/var/lib/milvus

volumes:
  pgvector_data:
  chromadb_data:
  qdrant_data:
  etcd_data:
  minio_data:
  milvus_data:
```

---

## Phase 2: PGVector Implementation

**Goal**: Establish baseline with PostgreSQL + pgvector extension.

### 2.1 Dependencies

Add to `package.json`:

```json
{
  "dependencies": {
    "pg": "^8.11.0",
    "pgvector": "^0.2.0"
  },
  "devDependencies": {
    "@types/pg": "^8.10.0"
  }
}
```

### 2.2 Module Structure

```typescript
// src/modules/vector-benchmarks/databases/pgvector/pgvector.module.ts
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PgVectorService } from "./pgvector.service";

@Module({
  imports: [ConfigModule],
  providers: [PgVectorService],
  exports: [PgVectorService],
})
export class PgVectorModule {}
```

### 2.3 Service Implementation

```typescript
// src/modules/vector-benchmarks/databases/pgvector/pgvector.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Pool, PoolClient } from "pg";
import pgvector from "pgvector/pg";
import {
  VectorDatabaseService,
  BenchmarkDocument,
  SearchResult,
  DatabaseStats,
} from "../../interfaces/benchmark-result.interface";

@Injectable()
export class PgVectorService implements VectorDatabaseService, OnModuleInit, OnModuleDestroy {
  private pool: Pool;
  private currentCollection: string;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.pool = new Pool({
      host: this.configService.get("PGVECTOR_HOST", "localhost"),
      port: this.configService.get("PGVECTOR_PORT", 5433),
      database: this.configService.get("PGVECTOR_DATABASE", "benchmark_db"),
      user: this.configService.get("PGVECTOR_USER", "benchmark_user"),
      password: this.configService.get("PGVECTOR_PASSWORD", "benchmark_pass"),
      max: 20,
    });

    await pgvector.registerType(this.pool);
    console.log("PGVector connection established");
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  async initialize(): Promise<void> {
    await this.pool.query("CREATE EXTENSION IF NOT EXISTS vector");
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

    // Create indexes
    await this.pool.query(`CREATE INDEX ON ${name} USING GIN (metadata)`);
    await this.pool.query(`CREATE INDEX ON ${name}(source)`);
    await this.pool.query(`CREATE INDEX ON ${name}(category)`);
  }

  async createVectorIndex(indexType: "hnsw" | "ivfflat" = "hnsw"): Promise<void> {
    const tableName = this.currentCollection;

    if (indexType === "hnsw") {
      await this.pool.query(`
        CREATE INDEX ON ${tableName}
        USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 64)
      `);
    } else {
      await this.pool.query(`
        CREATE INDEX ON ${tableName}
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100)
      `);
    }
  }

  async insertVectors(documents: BenchmarkDocument[]): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      // Batch insert
      const batchSize = 1000;
      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);
        const values = batch
          .map((doc, idx) => {
            const base = idx * 8;
            return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${
              base + 6
            }, $${base + 7}, $${base + 8})`;
          })
          .join(",");

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
          console.log(
            `Inserted ${Math.min(i + batchSize, documents.length)}/${documents.length} documents`,
          );
        }
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
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

  async filteredSearch(query: number[], filter: any, limit: number): Promise<SearchResult[]> {
    const client = await this.pool.connect();
    try {
      const efSearch = Math.max(limit * 2, 100);
      await client.query(`SET hnsw.ef_search = ${efSearch}`);

      // Build WHERE clause from filter
      const whereClauses: string[] = [];
      const params: any[] = [pgvector.toSql(query)];
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

      if (filter.word_count_min) {
        whereClauses.push(`word_count >= $${paramIndex}`);
        params.push(filter.word_count_min);
        paramIndex++;
      }

      if (filter.word_count_max) {
        whereClauses.push(`word_count <= $${paramIndex}`);
        params.push(filter.word_count_max);
        paramIndex++;
      }

      const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
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
    // Full text search would be added here
    return vectorResults.slice(0, limit);
  }

  async deleteCollection(name: string): Promise<void> {
    await this.pool.query(`DROP TABLE IF EXISTS ${name}`);
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
      memoryUsage: 0, // Would need to query pg_stat_activity
    };
  }
}
```

### 2.4 Benchmark Tests

```typescript
// src/modules/vector-benchmarks/benchmarks/latency.benchmark.ts
import { Injectable } from "@nestjs/common";
import { BaseBenchmark } from "./base.benchmark";
import { VectorDatabaseService, BenchmarkResult } from "../interfaces/benchmark-result.interface";

@Injectable()
export class LatencyBenchmark extends BaseBenchmark {
  async runBenchmark(
    service: VectorDatabaseService,
    queryVectors: number[][],
    config: any,
  ): Promise<BenchmarkResult> {
    const latencies: number[] = [];
    const startTime = Date.now();

    for (const queryVector of queryVectors) {
      const { latency } = await this.measureLatency(() =>
        service.vectorSearch(queryVector, config.topK),
      );
      latencies.push(latency);
    }

    const totalTime = (Date.now() - startTime) / 1000; // seconds
    const systemStats = this.getSystemStats();

    return {
      database: config.database,
      testName: "Latency Test",
      timestamp: new Date(),
      config,
      metrics: {
        latencyP50: this.calculatePercentile(latencies, 0.5),
        latencyP90: this.calculatePercentile(latencies, 0.9),
        latencyP99: this.calculatePercentile(latencies, 0.99),
        latencyMean: this.calculateMean(latencies),
        qps: queryVectors.length / totalTime,
        recall: config.recallTarget,
        memoryUsedMB: systemStats.memoryUsage,
        cpuUtilization: systemStats.cpuUsage,
        errors: 0,
        totalQueries: queryVectors.length,
      },
    };
  }
}
```

---

## Phase 3: ChromaDB Implementation

**Goal**: Evaluate embedded database for rapid prototyping.

### 3.1 Dependencies

```json
{
  "dependencies": {
    "chromadb": "^1.9.0"
  }
}
```

### 3.2 Service Implementation

```typescript
// src/modules/vector-benchmarks/databases/chromadb/chromadb.service.ts
import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ChromaClient, Collection } from "chromadb";
import {
  VectorDatabaseService,
  BenchmarkDocument,
  SearchResult,
  DatabaseStats,
} from "../../interfaces/benchmark-result.interface";

@Injectable()
export class ChromaDbService implements VectorDatabaseService, OnModuleInit {
  private client: ChromaClient;
  private collection: Collection;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const url = this.configService.get("CHROMADB_URL", "http://localhost:8000");
    this.client = new ChromaClient({ path: url });
    console.log("ChromaDB connection established");
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
        "hnsw:space": "cosine",
        "hnsw:construction_ef": 100,
        "hnsw:search_ef": 100,
        "hnsw:M": 16,
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
        text: (result.documents?.[0]?.[idx] as string) || "",
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
        text: (result.documents?.[0]?.[idx] as string) || "",
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
```

---

## Phase 4: Milvus Implementation

**Goal**: Test cloud-native architecture for enterprise scale.

### 4.1 Dependencies

```json
{
  "dependencies": {
    "@zilliz/milvus2-sdk-node": "^2.5.0"
  }
}
```

### 4.2 Service Implementation

```typescript
// src/modules/vector-benchmarks/databases/milvus/milvus.service.ts
import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MilvusClient, DataType, IndexType, MetricType } from "@zilliz/milvus2-sdk-node";
import {
  VectorDatabaseService,
  BenchmarkDocument,
  SearchResult,
  DatabaseStats,
} from "../../interfaces/benchmark-result.interface";

@Injectable()
export class MilvusService implements VectorDatabaseService, OnModuleInit {
  private client: MilvusClient;
  private currentCollection: string;
  private dimensions: number;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const host = this.configService.get("MILVUS_HOST", "localhost");
    const port = this.configService.get("MILVUS_PORT", "19530");

    this.client = new MilvusClient({ address: `${host}:${port}` });

    // CRITICAL: Wait for connection
    await this.client.connectPromise.catch((err) => {
      throw new Error(`Milvus connection failed: ${err.message}`);
    });

    console.log("Milvus connection established");
  }

  async initialize(): Promise<void> {
    // Milvus doesn't require initialization
  }

  async createCollection(name: string, dimensions: number): Promise<void> {
    this.currentCollection = name;
    this.dimensions = dimensions;

    // Drop collection if exists
    try {
      await this.client.dropCollection({ collection_name: name });
    } catch (error) {
      // Collection doesn't exist
    }

    // Create collection schema
    const schema = [
      {
        name: "id",
        description: "Document ID",
        data_type: DataType.VarChar,
        is_primary_key: true,
        max_length: 255,
      },
      {
        name: "text",
        description: "Document text",
        data_type: DataType.VarChar,
        max_length: 65535,
      },
      {
        name: "embedding",
        description: "Vector embedding",
        data_type: DataType.FloatVector,
        dim: dimensions,
      },
      {
        name: "source",
        data_type: DataType.VarChar,
        max_length: 255,
      },
      {
        name: "category",
        data_type: DataType.VarChar,
        max_length: 100,
      },
      {
        name: "word_count",
        data_type: DataType.Int32,
      },
    ];

    await this.client.createCollection({
      collection_name: name,
      schema,
      enable_dynamic_field: true,
    });
  }

  async createVectorIndex(): Promise<void> {
    await this.client.createIndex({
      collection_name: this.currentCollection,
      field_name: "embedding",
      index_type: IndexType.HNSW,
      metric_type: MetricType.COSINE,
      params: {
        M: 16,
        efConstruction: 200,
      },
    });

    await this.client.loadCollection({
      collection_name: this.currentCollection,
    });
  }

  async insertVectors(documents: BenchmarkDocument[]): Promise<void> {
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

      await this.client.insert({
        collection_name: this.currentCollection,
        data,
      });

      if ((i + batchSize) % 10000 === 0) {
        console.log(
          `Inserted ${Math.min(i + batchSize, documents.length)}/${documents.length} documents`,
        );
      }
    }
  }

  async vectorSearch(query: number[], limit: number): Promise<SearchResult[]> {
    const result = await this.client.search({
      collection_name: this.currentCollection,
      data: [query],
      anns_field: "embedding",
      limit,
      params: { ef: 200 },
      output_fields: ["id", "text", "source", "category"],
    });

    return result[0].map((item) => ({
      id: item.id as string,
      score: item.score || 0,
      document: {
        id: item.id as string,
        text: item.text || "",
        embedding: [],
        metadata: {
          source: item.source || "",
          category: item.category || "",
          author: "",
          created_at: new Date(),
          word_count: 0,
          tags: [],
        },
      },
    }));
  }

  async filteredSearch(query: number[], filter: any, limit: number): Promise<SearchResult[]> {
    // Build filter expression
    const filterExpressions: string[] = [];

    if (filter.source) {
      filterExpressions.push(`source == "${filter.source}"`);
    }
    if (filter.category) {
      filterExpressions.push(`category == "${filter.category}"`);
    }
    if (filter.word_count_min) {
      filterExpressions.push(`word_count >= ${filter.word_count_min}`);
    }
    if (filter.word_count_max) {
      filterExpressions.push(`word_count <= ${filter.word_count_max}`);
    }

    const filterExpression = filterExpressions.join(" && ");

    const result = await this.client.search({
      collection_name: this.currentCollection,
      data: [query],
      anns_field: "embedding",
      limit,
      params: { ef: 200 },
      filter: filterExpression || undefined,
      output_fields: ["id", "text", "source", "category"],
    });

    return result[0].map((item) => ({
      id: item.id as string,
      score: item.score || 0,
      document: {
        id: item.id as string,
        text: item.text || "",
        embedding: [],
        metadata: {
          source: item.source || "",
          category: item.category || "",
          author: "",
          created_at: new Date(),
          word_count: 0,
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
    // Simplified version - Milvus 2.5 supports BM25 but requires additional setup
    return this.vectorSearch(queryVector, limit);
  }

  async deleteCollection(name: string): Promise<void> {
    await this.client.dropCollection({ collection_name: name });
  }

  async getStats(): Promise<DatabaseStats> {
    const stats = await this.client.getCollectionStatistics({
      collection_name: this.currentCollection,
    });

    return {
      vectorCount: parseInt(stats.data.row_count || "0"),
      indexSize: 0,
      memoryUsage: 0,
    };
  }
}
```

---

## Phase 5: Qdrant Implementation

**Goal**: Validate sub-10ms P99 latency and Filterable HNSW.

### 5.1 Dependencies

```json
{
  "dependencies": {
    "@qdrant/js-client-rest": "^1.12.0"
  }
}
```

### 5.2 Service Implementation

```typescript
// src/modules/vector-benchmarks/databases/qdrant/qdrant.service.ts
import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { QdrantClient } from "@qdrant/js-client-rest";
import {
  VectorDatabaseService,
  BenchmarkDocument,
  SearchResult,
  DatabaseStats,
} from "../../interfaces/benchmark-result.interface";

@Injectable()
export class QdrantService implements VectorDatabaseService, OnModuleInit {
  private client: QdrantClient;
  private currentCollection: string;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const url = this.configService.get("QDRANT_URL", "http://localhost:6333");
    const apiKey = this.configService.get("QDRANT_API_KEY");

    this.client = new QdrantClient({
      url,
      apiKey,
    });

    console.log("Qdrant connection established");
  }

  async initialize(): Promise<void> {
    // Qdrant doesn't require initialization
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
        distance: "Cosine",
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
      field_name: "source",
      field_schema: "keyword",
    });

    await this.client.createPayloadIndex(name, {
      field_name: "category",
      field_schema: "keyword",
    });

    await this.client.createPayloadIndex(name, {
      field_name: "word_count",
      field_schema: "integer",
    });
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
        console.log(
          `Inserted ${Math.min(i + batchSize, documents.length)}/${documents.length} documents`,
        );
      }
    }
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
        text: (point.payload?.text as string) || "",
        embedding: [],
        metadata: {
          source: (point.payload?.source as string) || "",
          category: (point.payload?.category as string) || "",
          author: (point.payload?.author as string) || "",
          created_at: new Date(point.payload?.created_at as string),
          word_count: (point.payload?.word_count as number) || 0,
          tags: (point.payload?.tags as string[]) || [],
        },
      },
    }));
  }

  async filteredSearch(query: number[], filter: any, limit: number): Promise<SearchResult[]> {
    // Build Qdrant filter
    const must: any[] = [];

    if (filter.source) {
      must.push({ key: "source", match: { value: filter.source } });
    }
    if (filter.category) {
      must.push({ key: "category", match: { value: filter.category } });
    }
    if (filter.word_count_min) {
      must.push({ key: "word_count", range: { gte: filter.word_count_min } });
    }
    if (filter.word_count_max) {
      must.push({ key: "word_count", range: { lte: filter.word_count_max } });
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
        text: (point.payload?.text as string) || "",
        embedding: [],
        metadata: {
          source: (point.payload?.source as string) || "",
          category: (point.payload?.category as string) || "",
          author: (point.payload?.author as string) || "",
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
```

---

## Phase 6: LanceDB Implementation

**Goal**: Evaluate disk-based architecture for cost-efficient serverless.

### 6.1 Dependencies

```json
{
  "dependencies": {
    "@lancedb/lancedb": "^0.15.0"
  }
}
```

### 6.2 Service Implementation

```typescript
// src/modules/vector-benchmarks/databases/lancedb/lancedb.service.ts
import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as lancedb from "@lancedb/lancedb";
import {
  VectorDatabaseService,
  BenchmarkDocument,
  SearchResult,
  DatabaseStats,
} from "../../interfaces/benchmark-result.interface";

@Injectable()
export class LanceDbService implements VectorDatabaseService, OnModuleInit {
  private db: lancedb.Connection;
  private currentTable: string;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const uri = this.configService.get("LANCEDB_URI", "./data/lancedb");
    this.db = await lancedb.connect(uri);
    console.log("LanceDB connection established");
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
      id: "dummy",
      text: "dummy",
      embedding: new Array(dimensions).fill(0),
      source: "",
      category: "",
      word_count: 0,
    };

    const table = await this.db.createTable(name, [dummyDoc]);

    // Delete dummy document
    await table.delete('id = "dummy"');

    // Create vector index
    await table.createIndex("embedding", {
      type: "IVF_PQ",
      num_partitions: 256,
      num_sub_vectors: 96,
      metric: "cosine",
    });
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
          author: "",
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

    const whereClause = whereClauses.join(" AND ");

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
```

---

## Phase 7: Benchmark Orchestration & API

### 7.1 Main Service

```typescript
// src/modules/vector-benchmarks/vector-benchmarks.service.ts
import { Injectable } from "@nestjs/common";
import { PgVectorService } from "./databases/pgvector/pgvector.service";
import { ChromaDbService } from "./databases/chromadb/chromadb.service";
import { MilvusService } from "./databases/milvus/milvus.service";
import { QdrantService } from "./databases/qdrant/qdrant.service";
import { LanceDbService } from "./databases/lancedb/lancedb.service";
import { LatencyBenchmark } from "./benchmarks/latency.benchmark";
import { DatasetLoaderService } from "./data-generators/dataset-loader.service";
import { JsonReporterService } from "./reporters/json-reporter.service";
import { MarkdownReporterService } from "./reporters/markdown-reporter.service";
import {
  BenchmarkConfig,
  BenchmarkResult,
  VectorDatabaseService,
} from "./interfaces/benchmark-result.interface";
import { DatabaseType, BenchmarkType } from "./vector-benchmarks.enums";

@Injectable()
export class VectorBenchmarksService {
  constructor(
    private pgvectorService: PgVectorService,
    private chromadbService: ChromaDbService,
    private milvusService: MilvusService,
    private qdrantService: QdrantService,
    private lancedbService: LanceDbService,
    private latencyBenchmark: LatencyBenchmark,
    private datasetLoader: DatasetLoaderService,
    private jsonReporter: JsonReporterService,
    private markdownReporter: MarkdownReporterService,
  ) {}

  async runBenchmark(config: BenchmarkConfig): Promise<BenchmarkResult> {
    const service = this.getService(config.database);

    // Generate dataset
    console.log(`Generating ${config.vectorCount} vectors...`);
    const documents = await this.datasetLoader.generateBenchmarkDataset(
      config.vectorCount,
      config.dimensions,
    );

    // Setup collection
    console.log("Creating collection...");
    await service.initialize();
    await service.createCollection(`benchmark_${Date.now()}`, config.dimensions);

    // Insert data
    console.log("Inserting vectors...");
    await service.insertVectors(documents);

    // Generate queries
    const queryVectors = documents.slice(0, 1000).map((doc) => doc.embedding);

    // Run benchmark
    console.log(`Running ${config.queryType} benchmark...`);
    const result = await this.latencyBenchmark.runBenchmark(service, queryVectors, config);

    return result;
  }

  async runAllBenchmarks(vectorCount: number = 100000): Promise<BenchmarkResult[]> {
    const databases: DatabaseType[] = [
      DatabaseType.PGVECTOR,
      DatabaseType.CHROMADB,
      DatabaseType.MILVUS,
      DatabaseType.QDRANT,
      DatabaseType.LANCEDB,
    ];

    const results: BenchmarkResult[] = [];

    for (const database of databases) {
      console.log(`\n=== Benchmarking ${database} ===\n`);

      const config: BenchmarkConfig = {
        database,
        vectorCount,
        dimensions: 1536,
        concurrency: 10,
        duration: 60,
        queryType: "similarity",
        topK: 10,
        recallTarget: 0.99,
      };

      try {
        const result = await this.runBenchmark(config);
        results.push(result);
      } catch (error) {
        console.error(`Failed to benchmark ${database}:`, error.message);
      }
    }

    // Save results
    await this.jsonReporter.saveResults(results, `benchmark_${Date.now()}.json`);
    await this.markdownReporter.saveReport(results, `benchmark_${Date.now()}.md`);

    return results;
  }

  private getService(database: DatabaseType): VectorDatabaseService {
    switch (database) {
      case DatabaseType.PGVECTOR:
        return this.pgvectorService;
      case DatabaseType.CHROMADB:
        return this.chromadbService;
      case DatabaseType.MILVUS:
        return this.milvusService;
      case DatabaseType.QDRANT:
        return this.qdrantService;
      case DatabaseType.LANCEDB:
        return this.lancedbService;
      default:
        throw new Error(`Unknown database: ${database}`);
    }
  }
}
```

### 7.2 Controller

```typescript
// src/modules/vector-benchmarks/vector-benchmarks.controller.ts
import { Controller, Post, Body, Get, Param } from "@nestjs/common";
import { VectorBenchmarksService } from "./vector-benchmarks.service";
import { BenchmarkConfig } from "./interfaces/benchmark-result.interface";

@Controller("benchmarks")
export class VectorBenchmarksController {
  constructor(private benchmarksService: VectorBenchmarksService) {}

  @Post("run")
  async runBenchmark(@Body() config: BenchmarkConfig) {
    return this.benchmarksService.runBenchmark(config);
  }

  @Post("run-all")
  async runAllBenchmarks(@Body() body: { vectorCount?: number }) {
    return this.benchmarksService.runAllBenchmarks(body.vectorCount);
  }
}
```

---

## Implementation Checklist

### Phase 1: Infrastructure

- [ ] Create module structure
- [ ] Define TypeScript interfaces
- [ ] Implement base benchmark class
- [ ] Create data generators
- [ ] Setup reporters
- [ ] Add environment variables
- [ ] Create Docker Compose for databases

### Phase 2: PGVector

- [ ] Install dependencies
- [ ] Implement PgVectorService
- [ ] Add HNSW/IVFFlat indexing
- [ ] Implement vector search
- [ ] Implement filtered search
- [ ] Write unit tests

### Phase 3: ChromaDB

- [ ] Install dependencies
- [ ] Implement ChromaDbService
- [ ] Implement vector search
- [ ] Implement filtered search
- [ ] Write unit tests

### Phase 4: Milvus

- [ ] Install dependencies
- [ ] Implement MilvusService
- [ ] Configure collection schema
- [ ] Implement hybrid search
- [ ] Write unit tests

### Phase 5: Qdrant

- [ ] Install dependencies
- [ ] Implement QdrantService
- [ ] Configure filterable HNSW
- [ ] Implement payload indexes
- [ ] Write unit tests

### Phase 6: LanceDB

- [ ] Install dependencies
- [ ] Implement LanceDbService
- [ ] Configure IVF-PQ indexes
- [ ] Implement disk-based search
- [ ] Write unit tests

### Phase 7: Integration

- [ ] Implement orchestration service
- [ ] Create REST API
- [ ] Add benchmark types
- [ ] Implement result reporting
- [ ] Write E2E tests
- [ ] Generate final report

---

## Expected Outcomes

### Deliverables

1. **Working Implementation**: All 5 databases integrated with NestJS
2. **Benchmark Suite**: Latency, throughput, filtering, hybrid search tests
3. **Test Coverage**: Unit tests for each database service
4. **Results Reports**: JSON, CSV, and Markdown formats
5. **Docker Setup**: One-command database deployment
6. **Documentation**: API documentation and usage guide

### Key Metrics to Validate

From the research report:

1. ✅ PGVector: 471 QPS at 99% recall (50M vectors)
2. ✅ Qdrant: Sub-10ms P99 latency
3. ✅ Milvus: Hybrid search performance
4. ✅ ChromaDB: Scalability limits
5. ✅ LanceDB: Disk vs memory performance

### Success Criteria

1. All 5 databases successfully integrated
2. Benchmarks run without errors
3. Results match expected patterns from research
4. Code follows existing NestJS conventions
5. Tests pass with >80% coverage
6. Documentation is complete and clear

---

## Usage

### Starting Databases

```bash
# Start all database containers
docker-compose -f docker-compose.benchmarks.yml up -d

# Verify containers are running
docker ps
```

### Running Benchmarks

```bash
# Start the application
yarn start:dev

# Run all benchmarks via API
curl -X POST http://localhost:3000/benchmarks/run-all \
  -H "Content-Type: application/json" \
  -d '{"vectorCount": 100000}'

# Run specific benchmark
curl -X POST http://localhost:3000/benchmarks/run \
  -H "Content-Type: application/json" \
  -d '{
    "database": "pgvector",
    "vectorCount": 100000,
    "dimensions": 1536,
    "queryType": "similarity",
    "topK": 10,
    "recallTarget": 0.99
  }'
```

### Viewing Results

```bash
# Check results directory
ls -la benchmark-results/

# View latest results
cat benchmark-results/benchmark_*.json
cat benchmark-results/benchmark_*.md
```

---

## Appendix: Key Dependencies

```json
{
  "dependencies": {
    "@nestjs/common": "^10.3.1",
    "@nestjs/core": "^10.4.8",
    "@nestjs/config": "^3.1.1",
    "@qdrant/js-client-rest": "^1.12.0",
    "@zilliz/milvus2-sdk-node": "^2.5.0",
    "@lancedb/lancedb": "^0.15.0",
    "chromadb": "^1.9.0",
    "pg": "^8.11.0",
    "pgvector": "^0.2.0"
  }
}
```

---

**Document Version**: 2.0 (Implementation-Focused)
**Last Updated**: 2025-11-09
**Status**: Ready for AI Implementation
