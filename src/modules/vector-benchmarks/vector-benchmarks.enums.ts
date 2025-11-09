export enum DatabaseType {
  PGVECTOR = 'pgvector',
  CHROMADB = 'chromadb',
  MILVUS = 'milvus',
  QDRANT = 'qdrant',
  LANCEDB = 'lancedb',
}

export enum BenchmarkType {
  LATENCY = 'latency',
  THROUGHPUT = 'throughput',
  HYBRID_SEARCH = 'hybrid_search',
  FILTERING = 'filtering',
  INDEXING = 'indexing',
  CONCURRENT_LOAD = 'concurrent_load',
}
