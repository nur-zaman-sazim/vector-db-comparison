import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VectorBenchmarksController } from './vector-benchmarks.controller';
import { VectorBenchmarksService } from './vector-benchmarks.service';
import { DataGeneratorModule } from './data-generators/data-generator.module';
import { ReporterModule } from './reporters/reporter.module';
import { LatencyBenchmark } from './benchmarks/latency.benchmark';

@Module({
  imports: [ConfigModule, DataGeneratorModule, ReporterModule],
  controllers: [VectorBenchmarksController],
  providers: [VectorBenchmarksService, LatencyBenchmark],
  exports: [VectorBenchmarksService],
})
export class VectorBenchmarksModule {}
