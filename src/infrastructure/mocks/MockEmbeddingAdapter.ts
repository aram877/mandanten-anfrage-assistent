import { EmbeddingPort } from '@domain/ports';

export class MockEmbeddingAdapter implements EmbeddingPort {
  private readonly dimension: number;
  private readonly seed: number;

  constructor(dimension = 768, seed = 42) {
    this.dimension = dimension;
    this.seed = seed;
  }

  getDimension(): number {
    return this.dimension;
  }

  async embed(text: string): Promise<number[]> {
    // Deterministic pseudo-random vector seeded by text + seed
    const vector: number[] = [];
    let hash = this.seed;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
    }
    for (let i = 0; i < this.dimension; i++) {
      hash = ((hash << 5) - hash + i) | 0;
      vector.push((hash & 0x7fffffff) / 0x7fffffff - 0.5);
    }
    // Normalize
    const norm = Math.sqrt(vector.reduce((s, v) => s + v * v, 0));
    return vector.map(v => v / norm);
  }
}
