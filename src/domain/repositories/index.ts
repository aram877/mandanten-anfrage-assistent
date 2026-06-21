import { Inquiry, AnsweredInquiry, Draft, AuditEntry, SimilarityMatch } from '@domain/entities';
import { InquiryId, AnsweredInquiryId, DraftId, DraftStatus, InquiryStatus } from '@domain/value-objects';

export interface InquiryRepository {
  save(inquiry: Inquiry): Promise<void>;
  findById(id: InquiryId): Promise<Inquiry | null>;
  findByFileHash(hash: string): Promise<Inquiry | null>;
  findByStatus(status: InquiryStatus[]): Promise<Inquiry[]>;
  update(inquiry: Inquiry): Promise<void>;
}

export interface AnsweredInquiryRepository {
  save(answered: AnsweredInquiry): Promise<void>;
  findById(id: AnsweredInquiryId): Promise<AnsweredInquiry | null>;
  findBySeedId(seedId: string): Promise<AnsweredInquiry | null>;
  findAll(): Promise<AnsweredInquiry[]>;
}

export interface DraftRepository {
  save(draft: Draft): Promise<void>;
  findById(id: DraftId): Promise<Draft | null>;
  findActiveByInquiryId(inquiryId: InquiryId): Promise<Draft | null>;
  findByInquiryId(inquiryId: InquiryId): Promise<Draft[]>;
  update(draft: Draft): Promise<void>;
  countActiveByInquiryId(inquiryId: InquiryId): Promise<number>;
}

export interface SimilarityMatchRepository {
  saveAll(matches: SimilarityMatch[]): Promise<void>;
  findByInquiryId(inquiryId: InquiryId): Promise<SimilarityMatch[]>;
}

export interface AuditRepository {
  append(entry: Omit<AuditEntry, 'previousHash' | 'entryHash'>): Promise<AuditEntry>;
  findByInquiryId(inquiryId: InquiryId): Promise<AuditEntry[]>;
  findAll(): Promise<AuditEntry[]>;
  getLastHash(): Promise<string>;
  verifyChain(): Promise<{ valid: boolean; firstInvalidId?: string; totalVerified: number }>;
}
