import { Injectable } from "@nestjs/common";

import { performance } from "perf_hooks";

@Injectable()
export abstract class BaseBenchmark {
  protected calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * percentile) - 1;
    return sorted[Math.max(0, index)];
  }

  protected calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  protected async measureLatency<T>(fn: () => Promise<T>): Promise<{ result: T; latency: number }> {
    const start = performance.now();
    const result = await fn();
    const latency = performance.now() - start;
    return { result, latency };
  }

  protected async runConcurrent<T>(tasks: (() => Promise<T>)[], concurrency: number): Promise<T[]> {
    const results: T[] = [];
    for (let i = 0; i < tasks.length; i += concurrency) {
      const batch = tasks.slice(i, i + concurrency);
      const batchResults = await Promise.all(batch.map((task) => task()));
      results.push(...batchResults);
    }
    return results;
  }

  protected getSystemStats(): { cpuUsage: number; memoryUsage: number } {
    const usage = process.cpuUsage();
    const memUsage = process.memoryUsage();

    return {
      cpuUsage: (usage.user + usage.system) / 1000000, // Convert to seconds
      memoryUsage: memUsage.heapUsed / 1024 / 1024, // Convert to MB
    };
  }
}
