import { Injectable } from '@nestjs/common';

@Injectable()
export class EmbeddingGeneratorService {
  generateRandomVector(dimensions: number): number[] {
    const vector = new Array(dimensions);
    for (let i = 0; i < dimensions; i++) {
      vector[i] = Math.random() * 2 - 1; // Range: [-1, 1]
    }
    return this.normalize(vector);
  }

  generateRandomVectors(count: number, dimensions: number): number[][] {
    const vectors: number[][] = [];
    for (let i = 0; i < count; i++) {
      vectors.push(this.generateRandomVector(dimensions));
    }
    return vectors;
  }

  private normalize(vector: number[]): number[] {
    const magnitude = Math.sqrt(
      vector.reduce((sum, val) => sum + val * val, 0),
    );
    return vector.map((val) => val / magnitude);
  }
}
