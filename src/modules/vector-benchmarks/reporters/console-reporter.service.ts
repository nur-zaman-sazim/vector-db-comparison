import { Injectable } from '@nestjs/common';
import { BenchmarkResult } from '../interfaces/benchmark-result.interface';

@Injectable()
export class ConsoleReporterService {
  printResult(result: BenchmarkResult): void {
    console.log('\n' + '='.repeat(80));
    console.log(`Database: ${result.database}`);
    console.log(`Test: ${result.testName}`);
    console.log(`Timestamp: ${result.timestamp.toISOString()}`);
    console.log('-'.repeat(80));
    console.log('Configuration:');
    console.log(`  Vector Count: ${result.config.vectorCount.toLocaleString()}`);
    console.log(`  Dimensions: ${result.config.dimensions}`);
    console.log(`  Top-K: ${result.config.topK}`);
    console.log(`  Query Type: ${result.config.queryType}`);
    console.log('-'.repeat(80));
    console.log('Metrics:');
    console.log(`  Latency P50: ${result.metrics.latencyP50.toFixed(2)} ms`);
    console.log(`  Latency P90: ${result.metrics.latencyP90.toFixed(2)} ms`);
    console.log(`  Latency P99: ${result.metrics.latencyP99.toFixed(2)} ms`);
    console.log(`  QPS: ${result.metrics.qps.toFixed(2)}`);
    console.log(`  Recall: ${(result.metrics.recall * 100).toFixed(2)}%`);
    console.log(`  Memory Used: ${result.metrics.memoryUsedMB.toFixed(2)} MB`);
    console.log(`  Total Queries: ${result.metrics.totalQueries.toLocaleString()}`);
    console.log(`  Errors: ${result.metrics.errors}`);
    console.log('='.repeat(80) + '\n');
  }

  printSummary(results: BenchmarkResult[]): void {
    console.log('\n' + '='.repeat(80));
    console.log('BENCHMARK SUMMARY');
    console.log('='.repeat(80));

    const byDatabase = this.groupBy(results, 'database');

    for (const [database, dbResults] of Object.entries(byDatabase)) {
      console.log(`\n${database.toUpperCase()}`);
      console.log('-'.repeat(40));

      for (const result of dbResults) {
        console.log(
          `  ${result.testName}: P99=${result.metrics.latencyP99.toFixed(2)}ms, QPS=${result.metrics.qps.toFixed(2)}`,
        );
      }
    }

    console.log('\n' + '='.repeat(80) + '\n');
  }

  private groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce(
      (groups, item) => {
        const value = String(item[key]);
        groups[value] = groups[value] || [];
        groups[value].push(item);
        return groups;
      },
      {} as Record<string, T[]>,
    );
  }
}
