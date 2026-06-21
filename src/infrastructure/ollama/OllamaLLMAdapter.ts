import { LLMPort, LLMMessage, LLMTimeoutError, LLMConnectionError } from '@domain/ports';

interface OllamaChatResponse {
  message: { content: string };
}

export class OllamaLLMAdapter implements LLMPort {
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(params?: { baseUrl?: string; model?: string; timeoutMs?: number }) {
    this.baseUrl = params?.baseUrl ?? process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
    this.model = params?.model ?? process.env.LLM_MODEL ?? 'mistral';
    this.timeoutMs = params?.timeoutMs ?? Number(process.env.LLM_TIMEOUT_MS ?? 30000);
  }

  getModelName(): string {
    return this.model;
  }

  async complete(messages: LLMMessage[]): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: false,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new LLMConnectionError(`Ollama returned ${response.status}: ${await response.text()}`);
      }

      const data = (await response.json()) as OllamaChatResponse;
      return data.message.content;
    } catch (err: unknown) {
      if (err instanceof LLMConnectionError) throw err;
      if (err instanceof Error && err.name === 'AbortError') {
        throw new LLMTimeoutError(`LLM request timed out after ${this.timeoutMs}ms`);
      }
      throw new LLMConnectionError(`Failed to connect to Ollama: ${String(err)}`);
    } finally {
      clearTimeout(timer);
    }
  }
}
