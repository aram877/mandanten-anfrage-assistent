import { AnsweredInquiryId, Topic } from '@domain/value-objects';

export interface AnsweredInquiry {
  id: AnsweredInquiryId;
  seedId: string;
  question: string;
  answer: string;
  themaTag: Topic;
  rechtsgebiet: string;
  createdAt: Date;
}
