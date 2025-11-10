import {
  Entity,
  EntityRepositoryType,
  Enum,
  JsonType,
  PrimaryKey,
  Property,
} from "@mikro-orm/core";

import { BenchmarkResultsRepository } from "../../modules/vector-benchmarks/benchmark-results.repository";
import {
  DatabaseType,
  BenchmarkType,
} from "../../modules/vector-benchmarks/vector-benchmarks.enums";
import { CustomBaseEntity } from "./custom-base.entity";

export interface BenchmarkConfigData {
  database: string;
  vectorCount: number;
  dimensions: number;
  concurrency: number;
  duration: number;
  queryType: string;
  topK: number;
  recallTarget: number;
}

export interface BenchmarkMetricsData {
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
}

@Entity({
  tableName: "benchmark_results",
  repository: () => BenchmarkResultsRepository,
})
export class BenchmarkResult extends CustomBaseEntity {
  [EntityRepositoryType]?: BenchmarkResultsRepository;

  @PrimaryKey({ autoincrement: true })
  id!: number;

  @Enum({ items: () => DatabaseType, fieldName: "database_type" })
  databaseType!: DatabaseType;

  @Enum({ items: () => BenchmarkType, fieldName: "benchmark_type" })
  benchmarkType!: BenchmarkType;

  @Property({ fieldName: "test_name" })
  testName!: string;

  @Property({ fieldName: "test_timestamp" })
  testTimestamp!: Date;

  @Property({ type: JsonType, fieldName: "config" })
  config!: BenchmarkConfigData;

  @Property({ type: JsonType, fieldName: "metrics" })
  metrics!: BenchmarkMetricsData;

  @Property({ fieldName: "environment_info", nullable: true, columnType: "text" })
  environmentInfo?: string;

  @Property({ fieldName: "notes", nullable: true, columnType: "text" })
  notes?: string;
}
