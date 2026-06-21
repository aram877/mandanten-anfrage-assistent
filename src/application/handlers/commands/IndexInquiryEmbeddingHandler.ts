import { IndexInquiryEmbeddingCommand, FindSimilarInquiriesCommand } from '@domain/commands';
import { InquiryRepository, AuditRepository } from '@domain/repositories';
import { EmbeddingPort, VectorStorePort, LLMTimeoutError } from '@domain/ports';
import { createAuditEntryId } from '@domain/value-objects';
import { CommandBus } from '@application/buses';

export interface IndexInquiryEmbeddingHandlerDeps {
  inquiryRepository: InquiryRepository;
  auditRepository: AuditRepository;
  embeddingPort: EmbeddingPort;
  vectorStorePort: VectorStorePort;
  commandBus: CommandBus;
}

export function createIndexInquiryEmbeddingHandler(deps: IndexInquiryEmbeddingHandlerDeps) {
  return async (command: IndexInquiryEmbeddingCommand): Promise<void> => {
    const { inquiryRepository, auditRepository, embeddingPort, commandBus } = deps;

    const inquiry = await inquiryRepository.findById(command.inquiryId);
    if (!inquiry) throw new Error(`Inquiry not found: ${command.inquiryId}`);

    try {
      const textToEmbed = `${inquiry.subject}\n\n${inquiry.body}`;
      const vector = await embeddingPort.embed(textToEmbed);

      await auditRepository.append({
        id: createAuditEntryId(),
        timestamp: new Date(),
        eventType: 'EMBEDDING_INDEXED',
        actor: 'system',
        inquiryId: inquiry.id,
        payload: { dimension: vector.length },
      });

      await commandBus.dispatch<FindSimilarInquiriesCommand>({
        type: 'FindSimilarInquiries',
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
        payload: { error: String(err), step: 'embedding' },
      });
      throw err;
    }
  };
}
