import { simpleParser, ParsedMail } from 'mailparser';
import { convert } from 'html-to-text';
import fs from 'fs';
import { Inquiry, createInquiry } from '@domain/entities';
import { createInquiryId } from '@domain/value-objects';

export class EmlParser {
  async parseFile(filePath: string): Promise<{ inquiry: Inquiry; fileHash: string }> {
    const fileBuffer = fs.readFileSync(filePath);
    const fileHash = await this.computeHash(fileBuffer);

    const parsed: ParsedMail = await simpleParser(fileBuffer);

    const from = parsed.from?.text ?? 'Unbekannter Absender';
    const subject = parsed.subject?.trim() || '(kein Betreff)';
    const receivedAt = parsed.date ?? new Date();

    let body = '';
    if (parsed.text) {
      body = parsed.text.trim();
    } else if (parsed.html) {
      body = convert(parsed.html, {
        wordwrap: false,
        selectors: [{ selector: 'a', options: { ignoreHref: true } }],
      }).trim();
    }

    const inquiry = createInquiry({
      id: createInquiryId(),
      emlFilePath: filePath,
      emlFileHash: fileHash,
      from,
      subject,
      body,
      receivedAt,
    });

    return { inquiry, fileHash };
  }

  private async computeHash(buffer: Buffer): Promise<string> {
    const crypto = await import('crypto');
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }
}
