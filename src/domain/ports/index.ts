import { SimilarityMatch } from '@domain/entities';
import { AnsweredInquiryId, SimilarityScore } from '@domain/value-objects';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMPort {
  complete(messages: LLMMessage[]): Promise<string>;
  getModelName(): string;
}

export interface EmbeddingPort {
  embed(text: string): Promise<number[]>;
  getDimension(): number;
}

export interface VectorSearchResult {
  answeredInquiryId: AnsweredInquiryId;
  score: SimilarityScore;
  questionSnippet: string;
  answerSnippet: string;
}

export interface VectorStorePort {
  indexAnsweredInquiry(params: {
    answeredInquiryId: AnsweredInquiryId;
    vector: number[];
    questionSnippet: string;
    answerSnippet: string;
    themaTag: string;
  }): Promise<void>;
  search(queryVector: number[], topN: number): Promise<VectorSearchResult[]>;
  initialize(): Promise<void>;
}

export class LLMTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LLMTimeoutError';
  }
}

export class LLMConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LLMConnectionError';
  }
}
