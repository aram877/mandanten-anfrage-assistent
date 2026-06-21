import { SimilarityMatchId, InquiryId, AnsweredInquiryId, SimilarityScore } from '@domain/value-objects';

export interface SimilarityMatch {
  id: SimilarityMatchId;
  inquiryId: InquiryId;
  answeredInquiryId: AnsweredInquiryId;
  score: SimilarityScore;
  questionSnippet: string;
  answerSnippet: string;
  rank: number;
  createdAt: Date;
}
