import { Injectable } from '@nestjs/common';
import { EmbeddingGeneratorService } from './embedding-generator.service';
import { BenchmarkDocument } from '../interfaces/benchmark-result.interface';

@Injectable()
export class DatasetLoaderService {
  constructor(private embeddingGenerator: EmbeddingGeneratorService) {}

  async generateBenchmarkDataset(
    count: number,
    dimensions: number,
  ): Promise<BenchmarkDocument[]> {
    const documents: BenchmarkDocument[] = [];
    const categories = ['tech', 'science', 'health', 'business', 'sports'];
    const sources = ['wikipedia', 'arxiv', 'stackoverflow', 'medium', 'blogs'];

    for (let i = 0; i < count; i++) {
      documents.push({
        id: `doc_${i}`,
        text: this.generateRandomText(),
        embedding: this.embeddingGenerator.generateRandomVector(dimensions),
        metadata: {
          source: sources[Math.floor(Math.random() * sources.length)],
          category: categories[Math.floor(Math.random() * categories.length)],
          author: `author_${Math.floor(Math.random() * 100)}`,
          created_at: new Date(),
          word_count: Math.floor(Math.random() * 2000) + 100,
          tags: this.generateRandomTags(),
        },
      });

      // Log progress for large datasets
      if ((i + 1) % 10000 === 0) {
        console.log(`Generated ${i + 1}/${count} documents`);
      }
    }

    return documents;
  }

  private generateRandomText(): string {
    const words = [
      'vector',
      'database',
      'search',
      'embedding',
      'semantic',
      'query',
      'index',
      'performance',
      'benchmark',
      'test',
    ];
    const length = Math.floor(Math.random() * 50) + 10;
    return Array.from({ length }, () =>
      words[Math.floor(Math.random() * words.length)],
    ).join(' ');
  }

  private generateRandomTags(): string[] {
    const allTags = ['ml', 'ai', 'nlp', 'cv', 'rag', 'llm', 'data', 'analytics'];
    const count = Math.floor(Math.random() * 3) + 1;
    return Array.from({ length: count }, () =>
      allTags[Math.floor(Math.random() * allTags.length)],
    );
  }
}
