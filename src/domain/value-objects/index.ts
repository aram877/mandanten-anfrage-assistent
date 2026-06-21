import { v4 as uuidv4 } from 'uuid';

export type InquiryId = string & { readonly _brand: 'InquiryId' };
export type AnsweredInquiryId = string & { readonly _brand: 'AnsweredInquiryId' };
export type DraftId = string & { readonly _brand: 'DraftId' };
export type AuditEntryId = string & { readonly _brand: 'AuditEntryId' };
export type SimilarityMatchId = string & { readonly _brand: 'SimilarityMatchId' };

export function createInquiryId(value?: string): InquiryId {
  return (value ?? uuidv4()) as InquiryId;
}
export function createAnsweredInquiryId(value?: string): AnsweredInquiryId {
  return (value ?? uuidv4()) as AnsweredInquiryId;
}
export function createDraftId(value?: string): DraftId {
  return (value ?? uuidv4()) as DraftId;
}
export function createAuditEntryId(value?: string): AuditEntryId {
  return (value ?? uuidv4()) as AuditEntryId;
}

export type SimilarityScore = number & { readonly _brand: 'SimilarityScore' };

export function createSimilarityScore(value: number): SimilarityScore {
  if (value < 0 || value > 1) throw new Error(`SimilarityScore must be 0–1, got ${value}`);
  return value as SimilarityScore;
}

export type Topic = string & { readonly _brand: 'Topic' };
export function createTopic(value: string): Topic {
  return value as Topic;
}

export enum Urgency {
  HOCH = 'HOCH',
  MITTEL = 'MITTEL',
  NIEDRIG = 'NIEDRIG',
}

export enum DraftStatus {
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EDITED = 'EDITED',
}

export enum InquiryStatus {
  EINGEGANGEN = 'EINGEGANGEN',
  KLASSIFIZIERT = 'KLASSIFIZIERT',
  GEMATCHT = 'GEMATCHT',
  ENTWURF_ERSTELLT = 'ENTWURF_ERSTELLT',
  GENEHMIGT = 'GENEHMIGT',
  ABGELEHNT = 'ABGELEHNT',
}

export enum ClassificationConfidence {
  HOCH = 'hoch',
  MITTEL = 'mittel',
  NIEDRIG = 'niedrig',
}
