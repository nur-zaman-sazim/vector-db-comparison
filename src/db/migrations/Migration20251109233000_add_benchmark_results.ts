import { Migration } from '@mikro-orm/migrations';

export class Migration20251109233000_add_benchmark_results extends Migration {
  async up(): Promise<void> {
    this.addSql(
      `create table "benchmark_results" (
        "id" serial primary key,
        "created_at" timestamptz not null,
        "updated_at" timestamptz not null,
        "database_type" text check ("database_type" in ('pgvector', 'chromadb', 'milvus', 'qdrant', 'lancedb')) not null,
        "benchmark_type" text check ("benchmark_type" in ('latency', 'throughput', 'hybrid_search', 'filtering', 'indexing', 'concurrent_load')) not null,
        "test_name" varchar(255) not null,
        "test_timestamp" timestamptz not null,
        "config" jsonb not null,
        "metrics" jsonb not null,
        "environment_info" text,
        "notes" text
      );`,
    );

    // Create indexes for common queries
    this.addSql(
      'create index "benchmark_results_database_type_index" on "benchmark_results" ("database_type");',
    );
    this.addSql(
      'create index "benchmark_results_benchmark_type_index" on "benchmark_results" ("benchmark_type");',
    );
    this.addSql(
      'create index "benchmark_results_test_timestamp_index" on "benchmark_results" ("test_timestamp");',
    );
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "benchmark_results" cascade;');
  }
}
