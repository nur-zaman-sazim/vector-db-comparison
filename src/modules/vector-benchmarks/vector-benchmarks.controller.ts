import { Controller, Post, Body, Get } from '@nestjs/common';
import { VectorBenchmarksService } from './vector-benchmarks.service';
import { BenchmarkConfig } from './interfaces/benchmark-result.interface';

@Controller('benchmarks')
export class VectorBenchmarksController {
  constructor(private benchmarksService: VectorBenchmarksService) {}

  @Get('databases')
  getRegisteredDatabases() {
    return {
      databases: this.benchmarksService.getRegisteredDatabases(),
    };
  }

  @Post('run')
  async runBenchmark(@Body() config: BenchmarkConfig) {
    return this.benchmarksService.runBenchmark(config);
  }

  @Post('run-all')
  async runAllBenchmarks(@Body() body: { vectorCount?: number }) {
    return this.benchmarksService.runAllBenchmarks(body.vectorCount);
  }
}
