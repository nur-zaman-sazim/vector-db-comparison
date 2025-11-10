export interface IEnvironmentVariables {
  NODE_ENV: string;
  STAGE_ENV: "local" | "development" | "staging" | "production" | "test";
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_TOKEN_LIFETIME: string;
  BE_PORT: number;
  BE_WS_PORT: number;
  API_HEALTH_URL: string;
  AWS_S3_REGION: string;
  AWS_S3_ENDPOINT: string;
  AWS_S3_BUCKET_NAME: string;
  AWS_S3_BUCKET_URL: string;
  AWS_S3_PRESIGN_URL_EXPIRY_IN_MINUTES: number;
  DOCUSEAL_API_KEY?: string;
  SENDGRID_API_KEY: string;
  ENABLE_AUDIT_LOGGING?: "true" | "false";
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  WEB_CLIENT_BASE_URL: string;
  SEND_FROM_EMAIL: string;

  // Vector Database Configuration
  // PGVector uses the main DATABASE_URL connection

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
}
