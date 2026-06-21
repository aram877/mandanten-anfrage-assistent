import { SimilarityMatch } from '@domain/entities';
import { SimilarityMatchRepository } from '@domain/repositories';
import {
  InquiryId,
  createInquiryId,
  createAnsweredInquiryId,
  createSimilarityScore,
} from '@domain/value-objects';
import { getDatabase } from './connection';

interface SimilarityMatchRow {
  id: string;
  inquiry_id: string;
  answered_inquiry_id: string;
  score: number;
  question_snippet: string;
  answer_snippet: string;
  rank: number;
  created_at: string;
}

function rowToMatch(row: SimilarityMatchRow): SimilarityMatch {
  return {
    id: row.id as SimilarityMatch['id'],
    inquiryId: createInquiryId(row.inquiry_id),
    answeredInquiryId: createAnsweredInquiryId(row.answered_inquiry_id),
    score: createSimilarityScore(row.score),
    questionSnippet: row.question_snippet,
    answerSnippet: row.answer_snippet,
    rank: row.rank,
    createdAt: new Date(row.created_at),
  };
}

export class SQLiteSimilarityMatchRepository implements SimilarityMatchRepository {
  async saveAll(matches: SimilarityMatch[]): Promise<void> {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO similarity_matches (
        id, inquiry_id, answered_inquiry_id, score,
        question_snippet, answer_snippet, rank, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertAll = db.transaction((ms: SimilarityMatch[]) => {
      for (const m of ms) {
        stmt.run(m.id, m.inquiryId, m.answeredInquiryId, m.score, m.questionSnippet, m.answerSnippet, m.rank, m.createdAt.toISOString());
      }
    });
    insertAll(matches);
  }

  async findByInquiryId(inquiryId: InquiryId): Promise<SimilarityMatch[]> {
    const db = getDatabase();
    const rows = db.prepare(
      'SELECT * FROM similarity_matches WHERE inquiry_id = ? ORDER BY rank ASC'
    ).all(inquiryId) as SimilarityMatchRow[];
    return rows.map(rowToMatch);
  }
}
