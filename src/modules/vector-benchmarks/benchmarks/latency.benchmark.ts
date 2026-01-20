import { Injectable, Logger } from "@nestjs/common";

import {
  VectorDatabaseService,
  BenchmarkResult,
  BenchmarkConfig,
} from "../interfaces/benchmark-result.interface";
import { BaseBenchmark } from "./base.benchmark";

@Injectable()
export class LatencyBenchmark extends BaseBenchmark {
  private readonly logger = new Logger(LatencyBenchmark.name);

  async runBenchmark(
    service: VectorDatabaseService,
    queryVectors: number[][],
    config: BenchmarkConfig,
  ): Promise<BenchmarkResult> {
    this.logger.log(`Starting latency benchmark for ${config.database}`);
    this.logger.log(`Configuration: ${JSON.stringify(config, null, 2)}`);
    this.logger.log(`Running ${queryVectors.length} queries...`);

    const latencies: number[] = [];
    const startTime = Date.now();
    let errors = 0;

    const progressInterval = Math.max(1, Math.floor(queryVectors.length / 10)); // Log every 10%

    for (let i = 0; i < queryVectors.length; i++) {
      const queryVector = queryVectors[i];

      try {
        const { latency } = await this.measureLatency(() =>
          service.vectorSearch(queryVector, config.topK),
        );
        latencies.push(latency);
      } catch (error) {
        errors++;
        this.logger.warn(
          `Query ${i + 1} failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      // Log progress
      if ((i + 1) % progressInterval === 0 || i === queryVectors.length - 1) {
        const progress = (((i + 1) / queryVectors.length) * 100).toFixed(1);
        const elapsed = (Date.now() - startTime) / 1000;
        const qps = (i + 1) / elapsed;
        this.logger.log(
          `Progress: ${i + 1}/${queryVectors.length} queries (${progress}%) - ${qps.toFixed(
            2,
          )} QPS`,
        );
      }
    }

    const totalTime = (Date.now() - startTime) / 1000; // seconds
    const systemStats = this.getSystemStats();

    this.logger.log(`Benchmark completed in ${totalTime.toFixed(2)} seconds`);
    this.logger.log(`Total queries: ${queryVectors.length}, Errors: ${errors}`);
    this.logger.log(`Average QPS: ${(queryVectors.length / totalTime).toFixed(2)}`);

    return {
      database: config.database,
      testName: "Latency Test",
      timestamp: new Date(),
      config,
      metrics: {
        latencyP50: this.calculatePercentile(latencies, 0.5),
        latencyP90: this.calculatePercentile(latencies, 0.9),
        latencyP99: this.calculatePercentile(latencies, 0.99),
        latencyMean: this.calculateMean(latencies),
        qps: queryVectors.length / totalTime,
        recall: config.recallTarget,
        memoryUsedMB: systemStats.memoryUsage,
        cpuUtilization: systemStats.cpuUsage,
        errors,
        totalQueries: queryVectors.length,
      },
    };
  }
}
