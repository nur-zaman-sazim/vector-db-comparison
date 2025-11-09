import { Module } from '@nestjs/common';
import { EmbeddingGeneratorService } from './embedding-generator.service';
import { DatasetLoaderService } from './dataset-loader.service';
import { QueryGeneratorService } from './query-generator.service';

@Module({
  providers: [
    EmbeddingGeneratorService,
    DatasetLoaderService,
    QueryGeneratorService,
  ],
  exports: [EmbeddingGeneratorService, DatasetLoaderService, QueryGeneratorService],
})
export class DataGeneratorModule {}
