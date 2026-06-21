import { LLMPort, LLMMessage } from '@domain/ports';

export class MockLLMAdapter implements LLMPort {
  private responses: string[];
  private callIndex = 0;
  private readonly modelName: string;

  constructor(responses: string[] = ['Mock-Antwort auf Ihre Anfrage.'], modelName = 'mock-llm') {
    this.responses = responses;
    this.modelName = modelName;
  }

  getModelName(): string {
    return this.modelName;
  }

  async complete(_messages: LLMMessage[]): Promise<string> {
    const response = this.responses[this.callIndex % this.responses.length];
    this.callIndex++;
    return response;
  }

  setResponses(responses: string[]): void {
    this.responses = responses;
    this.callIndex = 0;
  }

  getCallCount(): number {
    return this.callIndex;
  }
}
