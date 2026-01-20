import { Controller, Post, Body, Get } from "@nestjs/common";

import { BenchmarkConfig } from "./interfaces/benchmark-result.interface";
import { VectorBenchmarksService } from "./vector-benchmarks.service";

@Controller("benchmarks")
export class VectorBenchmarksController {
  constructor(private benchmarksService: VectorBenchmarksService) {}

  @Get("databases")
  getRegisteredDatabases() {
    return {
      databases: this.benchmarksService.getRegisteredDatabases(),
    };
  }

  @Post("run")
  async runBenchmark(@Body() config: BenchmarkConfig) {
    return this.benchmarksService.runBenchmark(config);
  }

  @Post("run-all")
  async runAllBenchmarks(@Body() body: { vectorCount?: number }) {
    return this.benchmarksService.runAllBenchmarks(body.vectorCount);
  }
}
