import { Injectable } from '@nestjs/common';
import { BaseBenchmark } from './base.benchmark';
import {
  VectorDatabaseService,
  BenchmarkResult,
  BenchmarkConfig,
} from '../interfaces/benchmark-result.interface';

@Injectable()
export class LatencyBenchmark extends BaseBenchmark {
  async runBenchmark(
    service: VectorDatabaseService,
    queryVectors: number[][],
    config: BenchmarkConfig,
  ): Promise<BenchmarkResult> {
    const latencies: number[] = [];
    const startTime = Date.now();

    for (const queryVector of queryVectors) {
      const { latency } = await this.measureLatency(() =>
        service.vectorSearch(queryVector, config.topK),
      );
      latencies.push(latency);
    }

    const totalTime = (Date.now() - startTime) / 1000; // seconds
    const systemStats = this.getSystemStats();

    return {
      database: config.database,
      testName: 'Latency Test',
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
        errors: 0,
        totalQueries: queryVectors.length,
      },
    };
  }
}
