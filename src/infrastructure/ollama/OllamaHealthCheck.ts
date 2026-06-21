export interface OllamaHealthStatus {
  connected: boolean;
  llmModelAvailable: boolean;
  embeddingModelAvailable: boolean;
  llmModel: string;
  embeddingModel: string;
  error?: string;
}

interface OllamaTagsResponse {
  models: Array<{ name: string }>;
}

export async function checkOllamaHealth(): Promise<OllamaHealthStatus> {
  const baseUrl = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
  const llmModel = process.env.LLM_MODEL ?? 'mistral';
  const embeddingModel = process.env.EMBEDDING_MODEL ?? 'nomic-embed-text';

  try {
    const response = await fetch(`${baseUrl}/api/tags`, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) {
      return { connected: false, llmModelAvailable: false, embeddingModelAvailable: false, llmModel, embeddingModel, error: `HTTP ${response.status}` };
    }

    const data = (await response.json()) as OllamaTagsResponse;
    const availableModels = data.models.map(m => m.name);
    const llmAvailable = availableModels.some(m => m.startsWith(llmModel));
    const embAvailable = availableModels.some(m => m.startsWith(embeddingModel));

    return {
      connected: true,
      llmModelAvailable: llmAvailable,
      embeddingModelAvailable: embAvailable,
      llmModel,
      embeddingModel,
    };
  } catch (err: unknown) {
    return {
      connected: false,
      llmModelAvailable: false,
      embeddingModelAvailable: false,
      llmModel,
      embeddingModel,
      error: String(err),
    };
  }
}
