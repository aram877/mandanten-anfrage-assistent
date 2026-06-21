import { DraftId, InquiryId, AnsweredInquiryId, DraftStatus } from '@domain/value-objects';

export interface GroundingReference {
  answeredInquiryId: AnsweredInquiryId;
  score: number;
  questionSnippet: string;
}

export interface Draft {
  id: DraftId;
  inquiryId: InquiryId;
  originalAiText: string;
  currentText: string;
  status: DraftStatus;
  groundingReferences: GroundingReference[];
  modelName: string;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function createDraft(params: {
  id: DraftId;
  inquiryId: InquiryId;
  text: string;
  groundingReferences: GroundingReference[];
  modelName: string;
}): Draft {
  return {
    id: params.id,
    inquiryId: params.inquiryId,
    originalAiText: params.text,
    currentText: params.text,
    status: DraftStatus.PENDING_REVIEW,
    groundingReferences: params.groundingReferences,
    modelName: params.modelName,
    rejectionReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
