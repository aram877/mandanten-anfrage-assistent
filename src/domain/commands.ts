import { InquiryId, DraftId } from '@domain/value-objects';

export type CommandType =
  | 'IngestInquiry'
  | 'ClassifyInquiry'
  | 'IndexInquiryEmbedding'
  | 'FindSimilarInquiries'
  | 'DraftReply'
  | 'ApproveReply'
  | 'RejectReply'
  | 'EditDraft';

export interface Command {
  readonly type: CommandType;
}

export interface IngestInquiryCommand extends Command {
  readonly type: 'IngestInquiry';
  readonly emlFilePath: string;
}

export interface ClassifyInquiryCommand extends Command {
  readonly type: 'ClassifyInquiry';
  readonly inquiryId: InquiryId;
}

export interface IndexInquiryEmbeddingCommand extends Command {
  readonly type: 'IndexInquiryEmbedding';
  readonly inquiryId: InquiryId;
}

export interface FindSimilarInquiriesCommand extends Command {
  readonly type: 'FindSimilarInquiries';
  readonly inquiryId: InquiryId;
}

export interface DraftReplyCommand extends Command {
  readonly type: 'DraftReply';
  readonly inquiryId: InquiryId;
}

export interface ApproveReplyCommand extends Command {
  readonly type: 'ApproveReply';
  readonly draftId: DraftId;
  readonly inquiryId: InquiryId;
}

export interface RejectReplyCommand extends Command {
  readonly type: 'RejectReply';
  readonly draftId: DraftId;
  readonly inquiryId: InquiryId;
  readonly reason: string;
}

export interface EditDraftCommand extends Command {
  readonly type: 'EditDraft';
  readonly draftId: DraftId;
  readonly newText: string;
}
