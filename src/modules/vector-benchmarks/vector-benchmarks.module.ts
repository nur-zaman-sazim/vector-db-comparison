import { Module, OnModuleInit } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { MikroOrmModule } from "@mikro-orm/nestjs";

import { BenchmarkResult } from "../../common/entities/benchmark-results.entity";
import { LatencyBenchmark } from "./benchmarks/latency.benchmark";
import { DataGeneratorModule } from "./data-generators/data-generator.module";
import { PgVectorModule } from "./databases/pgvector/pgvector.module";
import { PgVectorService } from "./databases/pgvector/pgvector.service";
import { ChromaDbModule } from "./databases/chromadb/chromadb.module";
import { ChromaDbService } from "./databases/chromadb/chromadb.service";
import { MilvusModule } from "./databases/milvus/milvus.module";
import { MilvusService } from "./databases/milvus/milvus.service";
import { QdrantModule } from "./databases/qdrant/qdrant.module";
import { QdrantService } from "./databases/qdrant/qdrant.service";
import { LanceDbModule } from "./databases/lancedb/lancedb.module";
import { LanceDbService } from "./databases/lancedb/lancedb.service";
import { ReporterModule } from "./reporters/reporter.module";
import { VectorBenchmarksController } from "./vector-benchmarks.controller";
import { DatabaseType } from "./vector-benchmarks.enums";
import { VectorBenchmarksService } from "./vector-benchmarks.service";

@Module({
  imports: [
    ConfigModule,
    DataGeneratorModule,
    ReporterModule,
    PgVectorModule,
    ChromaDbModule,
    MilvusModule,
    QdrantModule,
    LanceDbModule,
    MikroOrmModule.forFeature([BenchmarkResult]),
  ],
  controllers: [VectorBenchmarksController],
  providers: [VectorBenchmarksService, LatencyBenchmark],
  exports: [VectorBenchmarksService],
})
export class VectorBenchmarksModule implements OnModuleInit {
  constructor(
    private benchmarksService: VectorBenchmarksService,
    private pgVectorService: PgVectorService,
    private chromaDbService: ChromaDbService,
    private milvusService: MilvusService,
    private qdrantService: QdrantService,
    private lanceDbService: LanceDbService,
  ) {}

  onModuleInit() {
    // Register database services
    this.benchmarksService.registerDatabaseService(DatabaseType.PGVECTOR, this.pgVectorService);
    this.benchmarksService.registerDatabaseService(DatabaseType.CHROMADB, this.chromaDbService);
    this.benchmarksService.registerDatabaseService(DatabaseType.MILVUS, this.milvusService);
    this.benchmarksService.registerDatabaseService(DatabaseType.QDRANT, this.qdrantService);
    this.benchmarksService.registerDatabaseService(DatabaseType.LANCEDB, this.lanceDbService);
  }
}
