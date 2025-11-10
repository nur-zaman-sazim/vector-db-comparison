import { EntityRepository } from "@mikro-orm/postgresql";

import { BenchmarkResult } from "../../common/entities/benchmark-results.entity";
import { DatabaseType, BenchmarkType } from "./vector-benchmarks.enums";

export class BenchmarkResultsRepository extends EntityRepository<BenchmarkResult> {
  async findByDatabaseType(databaseType: DatabaseType): Promise<BenchmarkResult[]> {
    return this.find(
      { databaseType },
      {
        orderBy: { testTimestamp: "DESC" },
      },
    );
  }

  async findByBenchmarkType(benchmarkType: BenchmarkType): Promise<BenchmarkResult[]> {
    return this.find(
      { benchmarkType },
      {
        orderBy: { testTimestamp: "DESC" },
      },
    );
  }

  async findRecent(limit: number = 10): Promise<BenchmarkResult[]> {
    return this.findAll({
      orderBy: { testTimestamp: "DESC" },
      limit,
    });
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<BenchmarkResult[]> {
    return this.find(
      {
        testTimestamp: {
          $gte: startDate,
          $lte: endDate,
        },
      },
      {
        orderBy: { testTimestamp: "DESC" },
      },
    );
  }
}
