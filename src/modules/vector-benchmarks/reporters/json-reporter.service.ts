import { Injectable } from '@nestjs/common';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { BenchmarkResult } from '../interfaces/benchmark-result.interface';

@Injectable()
export class JsonReporterService {
  private async ensureDirectory(): Promise<string> {
    const outputDir = join(process.cwd(), 'benchmark-results');
    await mkdir(outputDir, { recursive: true });
    return outputDir;
  }

  async saveResults(results: BenchmarkResult[], filename: string): Promise<void> {
    const outputDir = await this.ensureDirectory();
    const outputPath = join(outputDir, filename);
    await writeFile(outputPath, JSON.stringify(results, null, 2));
    console.log(`Results saved to: ${outputPath}`);
  }

  async loadResults(filename: string): Promise<BenchmarkResult[]> {
    const outputDir = await this.ensureDirectory();
    const inputPath = join(outputDir, filename);
    const data = await readFile(inputPath, 'utf-8');
    return JSON.parse(data);
  }
}
