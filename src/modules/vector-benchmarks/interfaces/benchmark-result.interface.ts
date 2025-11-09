export interface BenchmarkDocument {
  id: string;
  text: string;
  embedding: number[];
  metadata: {
    source: string;
    category: string;
    author: string;
    created_at: Date;
    word_count: number;
    tags: string[];
  };
}

export interface BenchmarkConfig {
  database: 'pgvector' | 'chromadb' | 'milvus' | 'qdrant' | 'lancedb';
  vectorCount: number;
  dimensions: number;
  concurrency: number;
  duration: number; // seconds
  queryType: 'similarity' | 'filter' | 'hybrid';
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
