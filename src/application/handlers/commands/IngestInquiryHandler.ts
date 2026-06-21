import { IngestInquiryCommand, ClassifyInquiryCommand } from '@domain/commands';
import { InquiryRepository, AuditRepository } from '@domain/repositories';
import { EmlParser, EmlFileWatcher } from '@infrastructure/eml';
import { createAuditEntryId } from '@domain/value-objects';
import { CommandBus } from '@application/buses';

export interface IngestInquiryHandlerDeps {
  inquiryRepository: InquiryRepository;
  auditRepository: AuditRepository;
  emlParser: EmlParser;
  emlFileWatcher: EmlFileWatcher;
  commandBus: CommandBus;
}

export function createIngestInquiryHandler(deps: IngestInquiryHandlerDeps) {
  return async (command: IngestInquiryCommand): Promise<void> => {
    const { emlParser, inquiryRepository, auditRepository, emlFileWatcher, commandBus } = deps;

    try {
      const { inquiry, fileHash } = await emlParser.parseFile(command.emlFilePath);

      // Duplicate check
      const existing = await inquiryRepository.findByFileHash(fileHash);
      if (existing) {
        await auditRepository.append({
          id: createAuditEntryId(),
          timestamp: new Date(),
          eventType: 'DUPLICATE_SKIPPED',
          actor: 'system',
          inquiryId: existing.id,
          payload: { filePath: command.emlFilePath, existingInquiryId: existing.id },
        });
        return;
      }

      await inquiryRepository.save(inquiry);

      await auditRepository.append({
        id: createAuditEntryId(),
        timestamp: new Date(),
        eventType: 'INQUIRY_INGESTED',
        actor: 'system',
        inquiryId: inquiry.id,
        payload: { filePath: command.emlFilePath, from: inquiry.from, subject: inquiry.subject },
      });

      await commandBus.dispatch<ClassifyInquiryCommand>({
        type: 'ClassifyInquiry',
        inquiryId: inquiry.id,
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('parse')) {
        emlFileWatcher.moveToFailed(command.emlFilePath);
        await auditRepository.append({
          id: createAuditEntryId(),
          timestamp: new Date(),
          eventType: 'PARSE_ERROR',
          actor: 'system',
          inquiryId: null,
          payload: { filePath: command.emlFilePath, error: String(err) },
        });
        return;
      }
      // DB or other errors: move to failed too
      emlFileWatcher.moveToFailed(command.emlFilePath);
      await auditRepository.append({
        id: createAuditEntryId(),
        timestamp: new Date(),
        eventType: 'PARSE_ERROR',
        actor: 'system',
        inquiryId: null,
        payload: { filePath: command.emlFilePath, error: String(err) },
      });
    }
  };
}
