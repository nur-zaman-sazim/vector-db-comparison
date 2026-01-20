import { Injectable } from "@nestjs/common";

import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

import { BenchmarkResult } from "../interfaces/benchmark-result.interface";

@Injectable()
export class CsvReporterService {
  private async ensureDirectory(): Promise<string> {
    const outputDir = join(process.cwd(), "benchmark-results");
    await mkdir(outputDir, { recursive: true });
    return outputDir;
  }

  async saveResults(results: BenchmarkResult[], filename: string): Promise<void> {
    const csv = this.generateCsv(results);
    const outputDir = await this.ensureDirectory();
    const outputPath = join(outputDir, filename);
    await writeFile(outputPath, csv);
    console.log(`CSV results saved to: ${outputPath}`);
  }

  private generateCsv(results: BenchmarkResult[]): string {
    const headers = [
      "Database",
      "Test Name",
      "Timestamp",
      "Vector Count",
      "Dimensions",
      "Top K",
      "Query Type",
      "P50 Latency (ms)",
      "P90 Latency (ms)",
      "P99 Latency (ms)",
      "Mean Latency (ms)",
      "QPS",
      "Recall",
      "Memory (MB)",
      "CPU Utilization",
      "Errors",
      "Total Queries",
    ];

    const rows = results.map((result) => [
      result.database,
      result.testName,
      result.timestamp.toISOString(),
      result.config.vectorCount.toString(),
      result.config.dimensions.toString(),
      result.config.topK.toString(),
      result.config.queryType,
      result.metrics.latencyP50.toFixed(2),
      result.metrics.latencyP90.toFixed(2),
      result.metrics.latencyP99.toFixed(2),
      result.metrics.latencyMean.toFixed(2),
      result.metrics.qps.toFixed(2),
      result.metrics.recall.toFixed(4),
      result.metrics.memoryUsedMB.toFixed(2),
      result.metrics.cpuUtilization.toFixed(2),
      result.metrics.errors.toString(),
      result.metrics.totalQueries.toString(),
    ]);

    return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  }
}
