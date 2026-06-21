import { EmbeddingPort } from '@domain/ports';
import { LLMTimeoutError, LLMConnectionError } from '@domain/ports';

interface OllamaEmbeddingResponse {
  embedding: number[];
}

export class OllamaEmbeddingAdapter implements EmbeddingPort {
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(params?: { baseUrl?: string; model?: string; timeoutMs?: number }) {
    this.baseUrl = params?.baseUrl ?? process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
    this.model = params?.model ?? process.env.EMBEDDING_MODEL ?? 'nomic-embed-text';
    this.timeoutMs = params?.timeoutMs ?? Number(process.env.LLM_TIMEOUT_MS ?? 30000);
  }

  getDimension(): number {
    return 768;
  }

  async embed(text: string): Promise<number[]> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: this.model, prompt: text }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new LLMConnectionError(`Ollama embedding returned ${response.status}: ${await response.text()}`);
      }

      const data = (await response.json()) as OllamaEmbeddingResponse;
      if (!Array.isArray(data.embedding) || data.embedding.length === 0) {
        throw new LLMConnectionError('Ollama returned empty embedding vector');
      }
      return data.embedding;
    } catch (err: unknown) {
      if (err instanceof LLMConnectionError) throw err;
      if (err instanceof Error && err.name === 'AbortError') {
        throw new LLMTimeoutError(`Embedding request timed out after ${this.timeoutMs}ms`);
      }
      throw new LLMConnectionError(`Failed to connect to Ollama for embedding: ${String(err)}`);
    } finally {
      clearTimeout(timer);
    }
  }
}
