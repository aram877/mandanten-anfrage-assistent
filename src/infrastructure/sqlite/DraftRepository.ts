import { Draft, GroundingReference } from '@domain/entities';
import { DraftRepository } from '@domain/repositories';
import {
  DraftId,
  InquiryId,
  DraftStatus,
  createDraftId,
  createInquiryId,
  createAnsweredInquiryId,
} from '@domain/value-objects';
import { getDatabase } from './connection';

interface DraftRow {
  id: string;
  inquiry_id: string;
  original_ai_text: string;
  current_text: string;
  status: string;
  grounding_references: string;
  model_name: string;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

function rowToDraft(row: DraftRow): Draft {
  const groundingRefs = JSON.parse(row.grounding_references) as Array<{
    answeredInquiryId: string;
    score: number;
    questionSnippet: string;
  }>;

  return {
    id: createDraftId(row.id),
    inquiryId: createInquiryId(row.inquiry_id),
    originalAiText: row.original_ai_text,
    currentText: row.current_text,
    status: row.status as DraftStatus,
    groundingReferences: groundingRefs.map(r => ({
      answeredInquiryId: createAnsweredInquiryId(r.answeredInquiryId),
      score: r.score,
      questionSnippet: r.questionSnippet,
    })),
    modelName: row.model_name,
    rejectionReason: row.rejection_reason,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class SQLiteDraftRepository implements DraftRepository {
  async save(draft: Draft): Promise<void> {
    const db = getDatabase();
    db.prepare(`
      INSERT INTO drafts (
        id, inquiry_id, original_ai_text, current_text, status,
        grounding_references, model_name, rejection_reason, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      draft.id,
      draft.inquiryId,
      draft.originalAiText,
      draft.currentText,
      draft.status,
      JSON.stringify(draft.groundingReferences),
      draft.modelName,
      draft.rejectionReason,
      draft.createdAt.toISOString(),
      draft.updatedAt.toISOString(),
    );
  }

  async findById(id: DraftId): Promise<Draft | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM drafts WHERE id = ?').get(id) as DraftRow | undefined;
    return row ? rowToDraft(row) : null;
  }

  async findActiveByInquiryId(inquiryId: InquiryId): Promise<Draft | null> {
    const db = getDatabase();
    const row = db.prepare(`
      SELECT * FROM drafts
      WHERE inquiry_id = ? AND status IN ('PENDING_REVIEW', 'EDITED')
      ORDER BY created_at DESC LIMIT 1
    `).get(inquiryId) as DraftRow | undefined;
    return row ? rowToDraft(row) : null;
  }

  async findByInquiryId(inquiryId: InquiryId): Promise<Draft[]> {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM drafts WHERE inquiry_id = ? ORDER BY created_at DESC').all(inquiryId) as DraftRow[];
    return rows.map(rowToDraft);
  }

  async update(draft: Draft): Promise<void> {
    const db = getDatabase();
    db.prepare(`
      UPDATE drafts SET
        current_text = ?,
        status = ?,
        rejection_reason = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      draft.currentText,
      draft.status,
      draft.rejectionReason,
      new Date().toISOString(),
      draft.id,
    );
  }

  async countActiveByInquiryId(inquiryId: InquiryId): Promise<number> {
    const db = getDatabase();
    const row = db.prepare(`
      SELECT COUNT(*) as count FROM drafts
      WHERE inquiry_id = ? AND status IN ('PENDING_REVIEW', 'EDITED')
    `).get(inquiryId) as { count: number };
    return row.count;
  }
}
