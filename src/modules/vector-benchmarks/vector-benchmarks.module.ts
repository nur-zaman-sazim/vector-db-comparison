import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VectorBenchmarksController } from './vector-benchmarks.controller';
import { VectorBenchmarksService } from './vector-benchmarks.service';
import { DataGeneratorModule } from './data-generators/data-generator.module';
import { ReporterModule } from './reporters/reporter.module';
import { LatencyBenchmark } from './benchmarks/latency.benchmark';
import { PgVectorModule } from './databases/pgvector/pgvector.module';
import { PgVectorService } from './databases/pgvector/pgvector.service';
import { DatabaseType } from './vector-benchmarks.enums';

@Module({
  imports: [ConfigModule, DataGeneratorModule, ReporterModule, PgVectorModule],
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
    this.benchmarksService.registerDatabaseService(
      DatabaseType.PGVECTOR,
      this.pgVectorService,
    );
  }
}
