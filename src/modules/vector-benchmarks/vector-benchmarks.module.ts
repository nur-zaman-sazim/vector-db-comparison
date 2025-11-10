import { Module, OnModuleInit } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { MikroOrmModule } from "@mikro-orm/nestjs";

import { BenchmarkResult } from "../../common/entities/benchmark-results.entity";
import { LatencyBenchmark } from "./benchmarks/latency.benchmark";
import { DataGeneratorModule } from "./data-generators/data-generator.module";
import { PgVectorModule } from "./databases/pgvector/pgvector.module";
import { PgVectorService } from "./databases/pgvector/pgvector.service";
import { ReporterModule } from "./reporters/reporter.module";
import { VectorBenchmarksController } from "./vector-benchmarks.controller";
import { DatabaseType } from "./vector-benchmarks.enums";
import { VectorBenchmarksService } from "./vector-benchmarks.service";

@Module({
  imports: [
    ConfigModule,
    DataGeneratorModule,
    ReporterModule,
    PgVectorModule,
    MikroOrmModule.forFeature([BenchmarkResult]),
  ],
  controllers: [VectorBenchmarksController],
  providers: [VectorBenchmarksService, LatencyBenchmark],
  exports: [VectorBenchmarksService],
})
export class VectorBenchmarksModule implements OnModuleInit {
  constructor(
    private benchmarksService: VectorBenchmarksService,
    private pgVectorService: PgVectorService,
  ) {}

  onModuleInit() {
    // Register database services
    this.benchmarksService.registerDatabaseService(DatabaseType.PGVECTOR, this.pgVectorService);
  }
}
