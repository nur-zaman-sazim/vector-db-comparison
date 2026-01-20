import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { MilvusClient, DataType, IndexType, MetricType } from "@zilliz/milvus2-sdk-node";

import {
  VectorDatabaseService,
  BenchmarkDocument,
  SearchResult,
  DatabaseStats,
  MetadataFilter,
} from "../../interfaces/benchmark-result.interface";

interface MilvusSearchResultItem {
  id: string | number;
  score?: number;
  text?: string;
  source?: string;
  category?: string;
  [key: string]: unknown;
}

@Injectable()
export class MilvusService implements VectorDatabaseService, OnModuleInit {
  private readonly logger = new Logger(MilvusService.name);
  private client!: MilvusClient;
  private currentCollection!: string;
  private dimensions!: number;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const host = this.configService.get("MILVUS_HOST", "localhost");
    const port = this.configService.get("MILVUS_PORT", "19530");

    this.client = new MilvusClient({ address: `${host}:${port}` });

    // CRITICAL: Wait for connection
    await this.client.connectPromise.catch((err) => {
      this.logger.error(`Milvus connection failed: ${err.message}`);
      throw new Error(`Milvus connection failed: ${err.message}`);
    });

    this.logger.log("Milvus connection established");
  }

  async initialize(): Promise<void> {
    // Milvus doesn't require initialization
    this.logger.log("Milvus service initialized");
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

    this.logger.log(`Collection "${name}" created with ${dimensions} dimensions`);
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

    this.logger.log("HNSW index created and collection loaded");
  }

  async insertVectors(documents: BenchmarkDocument[]): Promise<void> {
    const batchSize = 1000;
    const startTime = Date.now();

    this.logger.log(`Starting insertion of ${documents.length} vectors in batches of ${batchSize}`);

    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      const batchStart = Date.now();
      const batchNumber = Math.floor(i / batchSize) + 1;
      const progress = `${Math.min(i + batchSize, documents.length)}/${documents.length}`;

      this.logger.log(
        `Inserting batch ${batchNumber} (${batch.length} docs, progress: ${progress})`,
      );

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

      const batchDuration = Date.now() - batchStart;
      this.logger.log(
        `Batch ${batchNumber} inserted in ${batchDuration}ms (progress: ${progress})`,
      );
    }

    const totalDuration = Date.now() - startTime;
    this.logger.log(`Inserted ${documents.length} vectors successfully in ${totalDuration}ms`);
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

    // Milvus returns an array of result sets (one per query)
    const results = (result as unknown as MilvusSearchResultItem[][])[0] || [];
    return results.map((item: MilvusSearchResultItem) => ({
      id: String(item.id),
      score: item.score || 0,
      document: {
        id: String(item.id),
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

  async filteredSearch(
    query: number[],
    filter: MetadataFilter,
    limit: number,
  ): Promise<SearchResult[]> {
    // Build filter expression
    const filterExpressions: string[] = [];

    if (filter.source) {
      filterExpressions.push(`source == "${filter.source}"`);
    }
    if (filter.category) {
      filterExpressions.push(`category == "${filter.category}"`);
    }
    if (filter.word_count_min !== undefined) {
      filterExpressions.push(`word_count >= ${filter.word_count_min}`);
    }
    if (filter.word_count_max !== undefined) {
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

    // Milvus returns an array of result sets (one per query)
    const results = (result as unknown as MilvusSearchResultItem[][])[0] || [];
    return results.map((item: MilvusSearchResultItem) => ({
      id: String(item.id),
      score: item.score || 0,
      document: {
        id: String(item.id),
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
    this.logger.log(`Collection "${name}" deleted`);
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
