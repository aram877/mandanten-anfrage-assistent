import { FindSimilarInquiriesCommand, DraftReplyCommand } from '@domain/commands';
import { InquiryRepository, AuditRepository, SimilarityMatchRepository } from '@domain/repositories';
import { EmbeddingPort, VectorStorePort, LLMTimeoutError } from '@domain/ports';
import {
  createAuditEntryId,
  InquiryStatus,
} from '@domain/value-objects';
import { SimilarityMatch } from '@domain/entities';
import { v4 as uuidv4 } from 'uuid';
import { CommandBus } from '@application/buses';

export interface FindSimilarInquiriesHandlerDeps {
  inquiryRepository: InquiryRepository;
  auditRepository: AuditRepository;
  similarityMatchRepository: SimilarityMatchRepository;
  embeddingPort: EmbeddingPort;
  vectorStorePort: VectorStorePort;
  commandBus: CommandBus;
}

export function createFindSimilarInquiriesHandler(deps: FindSimilarInquiriesHandlerDeps) {
  return async (command: FindSimilarInquiriesCommand): Promise<void> => {
    const { inquiryRepository, auditRepository, similarityMatchRepository, embeddingPort, vectorStorePort, commandBus } = deps;

    const inquiry = await inquiryRepository.findById(command.inquiryId);
    if (!inquiry) throw new Error(`Inquiry not found: ${command.inquiryId}`);

    const topN = Number(process.env.SIMILARITY_TOP_N ?? 3);

    try {
      const textToEmbed = `${inquiry.subject}\n\n${inquiry.body}`;
      const queryVector = await embeddingPort.embed(textToEmbed);
      const results = await vectorStorePort.search(queryVector, topN);

      const matches: SimilarityMatch[] = results.map((r, index) => ({
        id: uuidv4() as SimilarityMatch['id'],
        inquiryId: inquiry.id,
        answeredInquiryId: r.answeredInquiryId,
        score: r.score,
        questionSnippet: r.questionSnippet,
        answerSnippet: r.answerSnippet,
        rank: index + 1,
        createdAt: new Date(),
      }));

      if (matches.length > 0) {
        await similarityMatchRepository.saveAll(matches);
      }

      const lowConfidence = results.length === 0 || results[0].score < 0.5;

      inquiry.status = InquiryStatus.GEMATCHT;
      if (lowConfidence) {
        inquiry.requiresManualReview = true;
      }
      await inquiryRepository.update(inquiry);

      await auditRepository.append({
        id: createAuditEntryId(),
        timestamp: new Date(),
        eventType: 'SIMILAR_MATCHES_FOUND',
        actor: 'system',
        inquiryId: inquiry.id,
        payload: {
          matchCount: matches.length,
          topScore: results[0]?.score ?? 0,
          lowConfidenceMatch: lowConfidence,
          matchIds: matches.map(m => m.answeredInquiryId),
        },
      });

      await commandBus.dispatch<DraftReplyCommand>({
        type: 'DraftReply',
        inquiryId: inquiry.id,
      });
    } catch (err: unknown) {
      const eventType = err instanceof LLMTimeoutError ? 'LLM_TIMEOUT' : 'LLM_ERROR';
      await auditRepository.append({
        id: createAuditEntryId(),
        timestamp: new Date(),
        eventType,
        actor: 'system',
        inquiryId: inquiry.id,
        payload: { error: String(err), step: 'similarity_search' },
      });
      throw err;
    }
  };
}
