import { Inquiry, ClassificationResult } from '@domain/entities';
import { InquiryRepository } from '@domain/repositories';
import {
  InquiryId,
  InquiryStatus,
  createInquiryId,
  createTopic,
  Urgency,
  ClassificationConfidence,
} from '@domain/value-objects';
import { getDatabase } from './connection';

interface InquiryRow {
  id: string;
  eml_file_path: string;
  eml_file_hash: string;
  from: string;
  subject: string;
  body: string;
  received_at: string;
  status: string;
  requires_manual_review: number;
  classification_rechtsgebiet: string | null;
  classification_thema_tag: string | null;
  classification_urgency: string | null;
  classification_confidence: string | null;
  created_at: string;
  updated_at: string;
}

function rowToInquiry(row: InquiryRow): Inquiry {
  const classificationResult: ClassificationResult | null =
    row.classification_rechtsgebiet
      ? {
          rechtsgebiet: row.classification_rechtsgebiet,
          themaTag: createTopic(row.classification_thema_tag ?? ''),
          urgency: row.classification_urgency as Urgency,
          confidence: row.classification_confidence as ClassificationConfidence,
        }
      : null;

  return {
    id: createInquiryId(row.id),
    emlFilePath: row.eml_file_path,
    emlFileHash: row.eml_file_hash,
    from: row.from,
    subject: row.subject,
    body: row.body,
    receivedAt: new Date(row.received_at),
    status: row.status as InquiryStatus,
    requiresManualReview: row.requires_manual_review === 1,
    classificationResult,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class SQLiteInquiryRepository implements InquiryRepository {
  async save(inquiry: Inquiry): Promise<void> {
    const db = getDatabase();
    db.prepare(`
      INSERT INTO inquiries (
        id, eml_file_path, eml_file_hash, "from", subject, body, received_at,
        status, requires_manual_review,
        classification_rechtsgebiet, classification_thema_tag,
        classification_urgency, classification_confidence,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      inquiry.id,
      inquiry.emlFilePath,
      inquiry.emlFileHash,
      inquiry.from,
      inquiry.subject,
      inquiry.body,
      inquiry.receivedAt.toISOString(),
      inquiry.status,
      inquiry.requiresManualReview ? 1 : 0,
      inquiry.classificationResult?.rechtsgebiet ?? null,
      inquiry.classificationResult?.themaTag ?? null,
      inquiry.classificationResult?.urgency ?? null,
      inquiry.classificationResult?.confidence ?? null,
      inquiry.createdAt.toISOString(),
      inquiry.updatedAt.toISOString(),
    );
  }

  async findById(id: InquiryId): Promise<Inquiry | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(id) as InquiryRow | undefined;
    return row ? rowToInquiry(row) : null;
  }

  async findByFileHash(hash: string): Promise<Inquiry | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM inquiries WHERE eml_file_hash = ?').get(hash) as InquiryRow | undefined;
    return row ? rowToInquiry(row) : null;
  }

  async findByStatus(statuses: InquiryStatus[]): Promise<Inquiry[]> {
    const db = getDatabase();
    const placeholders = statuses.map(() => '?').join(', ');
    const rows = db.prepare(`
      SELECT * FROM inquiries WHERE status IN (${placeholders})
      ORDER BY
        CASE status
          WHEN 'EINGEGANGEN' THEN 0
          WHEN 'KLASSIFIZIERT' THEN 1
          ELSE 2
        END,
        CASE classification_urgency
          WHEN 'HOCH' THEN 0
          WHEN 'MITTEL' THEN 1
          WHEN 'NIEDRIG' THEN 2
          ELSE 3
        END,
        received_at ASC
    `).all(...statuses) as InquiryRow[];
    return rows.map(rowToInquiry);
  }

  async update(inquiry: Inquiry): Promise<void> {
    const db = getDatabase();
    db.prepare(`
      UPDATE inquiries SET
        status = ?,
        requires_manual_review = ?,
        classification_rechtsgebiet = ?,
        classification_thema_tag = ?,
        classification_urgency = ?,
        classification_confidence = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      inquiry.status,
      inquiry.requiresManualReview ? 1 : 0,
      inquiry.classificationResult?.rechtsgebiet ?? null,
      inquiry.classificationResult?.themaTag ?? null,
      inquiry.classificationResult?.urgency ?? null,
      inquiry.classificationResult?.confidence ?? null,
      new Date().toISOString(),
      inquiry.id,
    );
  }
}
