import { Injectable } from "@nestjs/common";

import { EmbeddingGeneratorService } from "./embedding-generator.service";

@Injectable()
export class QueryGeneratorService {
  constructor(private embeddingGenerator: EmbeddingGeneratorService) {}

  generateQueryVectors(count: number, dimensions: number): number[][] {
    return this.embeddingGenerator.generateRandomVectors(count, dimensions);
  }

  generateQueryTexts(count: number): string[] {
    const templates = [
      "What is vector search",
      "How does semantic search work",
      "Best practices for embeddings",
      "Performance optimization techniques",
      "Database benchmarking methodology",
    ];

    const queries: string[] = [];
    for (let i = 0; i < count; i++) {
      queries.push(templates[i % templates.length]);
    }
    return queries;
  }
}
