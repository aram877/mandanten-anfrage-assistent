import { AnsweredInquiry } from '@domain/entities';
import { AnsweredInquiryRepository } from '@domain/repositories';
import { AnsweredInquiryId, createAnsweredInquiryId, createTopic } from '@domain/value-objects';
import { getDatabase } from './connection';

interface AnsweredInquiryRow {
  id: string;
  seed_id: string;
  question: string;
  answer: string;
  thema_tag: string;
  rechtsgebiet: string;
  created_at: string;
}

function rowToAnsweredInquiry(row: AnsweredInquiryRow): AnsweredInquiry {
  return {
    id: createAnsweredInquiryId(row.id),
    seedId: row.seed_id,
    question: row.question,
    answer: row.answer,
    themaTag: createTopic(row.thema_tag),
    rechtsgebiet: row.rechtsgebiet,
    createdAt: new Date(row.created_at),
  };
}

export class SQLiteAnsweredInquiryRepository implements AnsweredInquiryRepository {
  async save(answered: AnsweredInquiry): Promise<void> {
    const db = getDatabase();
    db.prepare(`
      INSERT INTO answered_inquiries (id, seed_id, question, answer, thema_tag, rechtsgebiet, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      answered.id,
      answered.seedId,
      answered.question,
      answered.answer,
      answered.themaTag,
      answered.rechtsgebiet,
      answered.createdAt.toISOString(),
    );
  }

  async findById(id: AnsweredInquiryId): Promise<AnsweredInquiry | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM answered_inquiries WHERE id = ?').get(id) as AnsweredInquiryRow | undefined;
    return row ? rowToAnsweredInquiry(row) : null;
  }

  async findBySeedId(seedId: string): Promise<AnsweredInquiry | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM answered_inquiries WHERE seed_id = ?').get(seedId) as AnsweredInquiryRow | undefined;
    return row ? rowToAnsweredInquiry(row) : null;
  }

  async findAll(): Promise<AnsweredInquiry[]> {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM answered_inquiries ORDER BY created_at ASC').all() as AnsweredInquiryRow[];
    return rows.map(rowToAnsweredInquiry);
  }
}
