import { ClassifyInquiryCommand, IndexInquiryEmbeddingCommand } from '@domain/commands';
import { InquiryRepository, AuditRepository } from '@domain/repositories';
import { LLMPort, LLMTimeoutError, LLMConnectionError } from '@domain/ports';
import {
  ClassificationConfidence,
  Urgency,
  InquiryStatus,
  createAuditEntryId,
  createTopic,
} from '@domain/value-objects';
import { ClassificationResult } from '@domain/entities';
import { CommandBus } from '@application/buses';
import { loadPromptConfig } from '@application/prompts';

export interface ClassifyInquiryHandlerDeps {
  inquiryRepository: InquiryRepository;
  auditRepository: AuditRepository;
  llmPort: LLMPort;
  commandBus: CommandBus;
}

interface ClassificationJson {
  rechtsgebiet: string;
  thema_tag: string;
  urgency: 'HOCH' | 'MITTEL' | 'NIEDRIG';
  confidence: 'hoch' | 'mittel' | 'niedrig';
}

function parseClassificationResponse(text: string): ClassificationJson {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in classification response');
  return JSON.parse(jsonMatch[0]) as ClassificationJson;
}

export function createClassifyInquiryHandler(deps: ClassifyInquiryHandlerDeps) {
  return async (command: ClassifyInquiryCommand): Promise<void> => {
    const { inquiryRepository, auditRepository, llmPort, commandBus } = deps;

    const inquiry = await inquiryRepository.findById(command.inquiryId);
    if (!inquiry) throw new Error(`Inquiry not found: ${command.inquiryId}`);

    const promptConfig = loadPromptConfig();

    try {
      const response = await llmPort.complete([
        { role: 'system', content: promptConfig.classificationSystemPrompt },
        {
          role: 'user',
          content: `Betreff: ${inquiry.subject}\n\nAnfragetext:\n${inquiry.body}`,
        },
      ]);

      const parsed = parseClassificationResponse(response);

      const classificationResult: ClassificationResult = {
        rechtsgebiet: parsed.rechtsgebiet || 'Umsatzsteuer',
        themaTag: createTopic(parsed.thema_tag || 'Allgemein'),
        urgency: (parsed.urgency as Urgency) || Urgency.MITTEL,
        confidence: (parsed.confidence as ClassificationConfidence) || ClassificationConfidence.MITTEL,
      };

      inquiry.classificationResult = classificationResult;
      inquiry.status = InquiryStatus.KLASSIFIZIERT;
      inquiry.requiresManualReview =
        classificationResult.urgency === Urgency.HOCH ||
        classificationResult.confidence === ClassificationConfidence.NIEDRIG;

      await inquiryRepository.update(inquiry);

      await auditRepository.append({
        id: createAuditEntryId(),
        timestamp: new Date(),
        eventType: 'INQUIRY_CLASSIFIED',
        actor: 'system',
        inquiryId: inquiry.id,
        payload: {
          rechtsgebiet: classificationResult.rechtsgebiet,
          themaTag: classificationResult.themaTag,
          urgency: classificationResult.urgency,
          confidence: classificationResult.confidence,
          requiresManualReview: inquiry.requiresManualReview,
          modelName: llmPort.getModelName(),
        },
      });

      await commandBus.dispatch<IndexInquiryEmbeddingCommand>({
        type: 'IndexInquiryEmbedding',
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
        payload: { error: String(err), step: 'classification' },
      });
      throw err;
    }
  };
}
