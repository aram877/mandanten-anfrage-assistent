import { InquiryId, InquiryStatus } from '@domain/value-objects';
import { Inquiry, AnsweredInquiry, Draft, AuditEntry, SimilarityMatch } from '@domain/entities';

export type QueryType = 'ListTriageQueue' | 'GetCaseView' | 'SearchAuditLog';

export interface Query {
  readonly type: QueryType;
}

export interface ListTriageQueueQuery extends Query {
  readonly type: 'ListTriageQueue';
}

export interface TriageQueueItem {
  inquiry: Inquiry;
  draftStatus: string | null;
}

export interface GetCaseViewQuery extends Query {
  readonly type: 'GetCaseView';
  readonly inquiryId: InquiryId;
}

export interface CaseView {
  inquiry: Inquiry;
  matches: (SimilarityMatch & { answeredInquiry: AnsweredInquiry })[];
  activeDraft: Draft | null;
}

export interface SearchAuditLogQuery extends Query {
  readonly type: 'SearchAuditLog';
  readonly inquiryId: InquiryId;
}

export interface AuditLogResult {
  entries: AuditEntry[];
  chainValid: boolean;
  totalVerified: number;
  firstInvalidId?: string;
}
