import { Injectable } from "@nestjs/common";

import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

import { BenchmarkResult } from "../interfaces/benchmark-result.interface";

@Injectable()
export class MarkdownReporterService {
  private async ensureDirectory(): Promise<string> {
    const outputDir = join(process.cwd(), "benchmark-results");
    await mkdir(outputDir, { recursive: true });
    return outputDir;
  }

  async generateReport(results: BenchmarkResult[]): Promise<string> {
    let markdown = "# Vector Database Benchmark Results\n\n";
    markdown += `Generated: ${new Date().toISOString()}\n\n`;

    // Group by database
    const byDatabase = this.groupBy(results, "database");

    for (const [database, dbResults] of Object.entries(byDatabase)) {
      markdown += `## ${database}\n\n`;

      // Group by test type
      const byTest = this.groupBy(dbResults, "testName");

      for (const [testName, testResults] of Object.entries(byTest)) {
        markdown += `### ${testName}\n\n`;
        markdown += this.generateTable(testResults);
        markdown += "\n\n";
      }
    }

    return markdown;
  }

  async saveReport(results: BenchmarkResult[], filename: string): Promise<void> {
    const markdown = await this.generateReport(results);
    const outputDir = await this.ensureDirectory();
    const outputPath = join(outputDir, filename);
    await writeFile(outputPath, markdown);
    console.log(`Report saved to: ${outputPath}`);
  }

  private generateTable(results: BenchmarkResult[]): string {
    let table = "| Vector Count | P50 (ms) | P99 (ms) | QPS | Recall | Memory (MB) |\n";
    table += "|--------------|----------|----------|-----|--------|-------------|\n";

    for (const result of results) {
      table += `| ${result.config.vectorCount} | `;
      table += `${result.metrics.latencyP50.toFixed(2)} | `;
      table += `${result.metrics.latencyP99.toFixed(2)} | `;
      table += `${result.metrics.qps.toFixed(2)} | `;
      table += `${(result.metrics.recall * 100).toFixed(2)}% | `;
      table += `${result.metrics.memoryUsedMB.toFixed(2)} |\n`;
    }

    return table;
  }

  private groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const value = String(item[key]);
      groups[value] = groups[value] || [];
      groups[value].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }
}
