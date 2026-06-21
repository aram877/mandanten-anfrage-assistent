import {
  InquiryId,
  Urgency,
  Topic,
  InquiryStatus,
  ClassificationConfidence,
} from '@domain/value-objects';

export interface ClassificationResult {
  rechtsgebiet: string;
  themaTag: Topic;
  urgency: Urgency;
  confidence: ClassificationConfidence;
}

export interface Inquiry {
  id: InquiryId;
  emlFilePath: string;
  emlFileHash: string;
  from: string;
  subject: string;
  body: string;
  receivedAt: Date;
  status: InquiryStatus;
  requiresManualReview: boolean;
  classificationResult: ClassificationResult | null;
  createdAt: Date;
  updatedAt: Date;
}

export function createInquiry(params: {
  id: InquiryId;
  emlFilePath: string;
  emlFileHash: string;
  from: string;
  subject: string;
  body: string;
  receivedAt: Date;
}): Inquiry {
  return {
    ...params,
    status: InquiryStatus.EINGEGANGEN,
    requiresManualReview: false,
    classificationResult: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
