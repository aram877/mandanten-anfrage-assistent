import path from 'path';
import fs from 'fs';
import { VectorStorePort, VectorSearchResult } from '@domain/ports';
import { AnsweredInquiryId, createAnsweredInquiryId, createSimilarityScore } from '@domain/value-objects';

const COLLECTION_NAME = 'answered_inquiries';

interface VectorRecord {
  id: string;
  vector: number[];
  questionSnippet: string;
  answerSnippet: string;
  themaTag: string;
}

export class LanceDBVectorStoreAdapter implements VectorStorePort {
  private readonly storePath: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private table: any | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private db: any | null = null;

  constructor(storePath?: string) {
    this.storePath = storePath ?? process.env.VECTOR_STORE_PATH ?? './data/vector-store';
  }

  async initialize(): Promise<void> {
    // Dynamic import to avoid build-time issues with native module
    const lancedb = await import('@lancedb/lancedb');
    const resolvedPath = path.resolve(this.storePath);
    if (!fs.existsSync(resolvedPath)) {
      fs.mkdirSync(resolvedPath, { recursive: true });
    }

    this.db = await lancedb.connect(resolvedPath);

    const tableNames: string[] = await this.db.tableNames();
    if (tableNames.includes(COLLECTION_NAME)) {
      this.table = await this.db.openTable(COLLECTION_NAME);
    } else {
      // Create with a placeholder record to establish schema
      this.table = await this.db.createTable(COLLECTION_NAME, [
        {
          id: '__placeholder__',
          vector: new Array(768).fill(0),
          questionSnippet: '',
          answerSnippet: '',
          themaTag: '',
        },
      ]);
      // Remove placeholder
      await this.table.delete("id = '__placeholder__'");
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.table) {
      await this.initialize();
    }
  }

  async indexAnsweredInquiry(params: {
    answeredInquiryId: AnsweredInquiryId;
    vector: number[];
    questionSnippet: string;
    answerSnippet: string;
    themaTag: string;
  }): Promise<void> {
    await this.ensureInitialized();
    await this.table.add([
      {
        id: params.answeredInquiryId,
        vector: params.vector,
        questionSnippet: params.questionSnippet,
        answerSnippet: params.answerSnippet,
        themaTag: params.themaTag,
      },
    ]);
  }

  async search(queryVector: number[], topN: number): Promise<VectorSearchResult[]> {
    await this.ensureInitialized();

    const results = await this.table
      .vectorSearch(queryVector)
      .limit(topN)
      .toArray();

    return results.map((r: VectorRecord & { _distance: number }) => ({
      answeredInquiryId: createAnsweredInquiryId(r.id),
      score: createSimilarityScore(Math.max(0, Math.min(1, 1 - r._distance))),
      questionSnippet: r.questionSnippet,
      answerSnippet: r.answerSnippet,
    }));
  }
}
