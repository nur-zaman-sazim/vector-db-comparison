import { Injectable, Logger } from "@nestjs/common";

import { InjectRepository } from "@mikro-orm/nestjs";

import { BenchmarkResult } from "../../common/entities/benchmark-results.entity";
import { BenchmarkResultsRepository } from "./benchmark-results.repository";
import { LatencyBenchmark } from "./benchmarks/latency.benchmark";
import { DatasetLoaderService } from "./data-generators/dataset-loader.service";
import {
  BenchmarkConfig,
  BenchmarkResult as BenchmarkResultInterface,
  VectorDatabaseService,
} from "./interfaces/benchmark-result.interface";
import { ConsoleReporterService } from "./reporters/console-reporter.service";
import { JsonReporterService } from "./reporters/json-reporter.service";
import { MarkdownReporterService } from "./reporters/markdown-reporter.service";
import { DatabaseType, BenchmarkType } from "./vector-benchmarks.enums";

@Injectable()
export class VectorBenchmarksService {
  private readonly logger = new Logger(VectorBenchmarksService.name);
  private databaseServices: Map<DatabaseType, VectorDatabaseService> = new Map();

  constructor(
    @InjectRepository(BenchmarkResult)
    private benchmarkResultsRepo: BenchmarkResultsRepository,
    private latencyBenchmark: LatencyBenchmark,
    private datasetLoader: DatasetLoaderService,
    private jsonReporter: JsonReporterService,
    private markdownReporter: MarkdownReporterService,
    private consoleReporter: ConsoleReporterService,
  ) {}

  registerDatabaseService(type: DatabaseType, service: VectorDatabaseService): void {
    this.databaseServices.set(type, service);
    this.logger.log(`Registered database service: ${type}`);
  }

  async runBenchmark(
    config: BenchmarkConfig,
    persistToDb: boolean = true,
  ): Promise<BenchmarkResultInterface> {
    const service = this.databaseServices.get(config.database as DatabaseType);

    if (!service) {
      throw new Error(
        `Database service not registered: ${config.database}. Available: ${Array.from(
          this.databaseServices.keys(),
        ).join(", ")}`,
      );
    }

    this.logger.log(`Starting benchmark for ${config.database}`);

    // Generate dataset
    this.logger.log(
      `Generating ${config.vectorCount} vectors with ${config.dimensions} dimensions...`,
    );
    const datasetStart = Date.now();
    const documents = await this.datasetLoader.generateBenchmarkDataset(
      config.vectorCount,
      config.dimensions,
    );
    const datasetTime = (Date.now() - datasetStart) / 1000;
    this.logger.log(`Dataset generation completed in ${datasetTime.toFixed(2)} seconds`);

    // Setup collection
    this.logger.log("Initializing database service...");
    await service.initialize();
    const collectionName = `benchmark_${Date.now()}`;
    this.logger.log(`Creating collection: ${collectionName}`);
    await service.createCollection(collectionName, config.dimensions);

    // Insert data
    this.logger.log(`Inserting ${documents.length} vectors...`);
    const insertStart = Date.now();
    await service.insertVectors(documents);
    const insertTime = (Date.now() - insertStart) / 1000;
    this.logger.log(
      `Vector insertion completed in ${insertTime.toFixed(2)} seconds (${(
        documents.length / insertTime
      ).toFixed(2)} vectors/sec)`,
    );

    // Generate queries
    const queryVectors = documents.slice(0, 1000).map((doc) => doc.embedding);

    // Run benchmark
    this.logger.log(`Running ${config.queryType} benchmark...`);
    const result = await this.latencyBenchmark.runBenchmark(service, queryVectors, config);

    // Print results
    this.consoleReporter.printResult(result);

    // Persist to database
    if (persistToDb) {
      await this.saveBenchmarkResult(result);
    }

    // Cleanup
    try {
      await service.deleteCollection(collectionName);
      this.logger.log("Collection deleted");
    } catch (error) {
      this.logger.warn(
        `Failed to delete collection: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return result;
  }

  private async saveBenchmarkResult(result: BenchmarkResultInterface): Promise<void> {
    try {
      const entity = this.benchmarkResultsRepo.create({
        databaseType: result.database as DatabaseType,
        benchmarkType: BenchmarkType.LATENCY, // Will be dynamic when we add more benchmarks
        testName: result.testName,
        testTimestamp: result.timestamp,
        config: result.config,
        metrics: result.metrics,
        environmentInfo: `Node ${process.version}, Platform: ${process.platform}`,
      });

      await this.benchmarkResultsRepo.getEntityManager().persistAndFlush(entity);
      this.logger.log(`Benchmark result saved to database (ID: ${entity.id})`);
    } catch (error) {
      this.logger.error(
        `Failed to save benchmark result: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async runAllBenchmarks(vectorCount: number = 100000): Promise<BenchmarkResultInterface[]> {
    const databases = Array.from(this.databaseServices.keys());
    const results: BenchmarkResultInterface[] = [];

    for (const database of databases) {
      this.logger.log(`\n=== Benchmarking ${database} ===\n`);

      const config: BenchmarkConfig = {
        database,
        vectorCount,
        dimensions: 1536,
        concurrency: 10,
        duration: 60,
        queryType: "similarity",
        topK: 10,
        recallTarget: 0.99,
      };

      try {
        const result = await this.runBenchmark(config);
        results.push(result);
      } catch (error) {
        this.logger.error(
          `Failed to benchmark ${database}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    // Save results
    const timestamp = Date.now();
    await this.jsonReporter.saveResults(results, `benchmark_${timestamp}.json`);
    await this.markdownReporter.saveReport(results, `benchmark_${timestamp}.md`);

    // Print summary
    this.consoleReporter.printSummary(results);

    return results;
  }

  getRegisteredDatabases(): string[] {
    return Array.from(this.databaseServices.keys());
  }
}
