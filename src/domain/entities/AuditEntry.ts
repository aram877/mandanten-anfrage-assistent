import { AuditEntryId, InquiryId } from '@domain/value-objects';

export type AuditActor = 'system' | 'human';

export type AuditEventType =
  | 'INQUIRY_INGESTED'
  | 'DUPLICATE_SKIPPED'
  | 'PARSE_ERROR'
  | 'INQUIRY_CLASSIFIED'
  | 'EMBEDDING_INDEXED'
  | 'SIMILAR_MATCHES_FOUND'
  | 'DRAFT_GENERATED'
  | 'DRAFT_EDITED'
  | 'DRAFT_APPROVED'
  | 'DRAFT_REJECTED'
  | 'LLM_TIMEOUT'
  | 'LLM_ERROR';

export interface AuditEntry {
  id: AuditEntryId;
  timestamp: Date;
  eventType: AuditEventType;
  actor: AuditActor;
  inquiryId: InquiryId | null;
  payload: Record<string, unknown>;
  previousHash: string;
  entryHash: string;
}
