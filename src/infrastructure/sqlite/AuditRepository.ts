import crypto from 'crypto';
import { AuditEntry, AuditActor, AuditEventType } from '@domain/entities';
import { AuditRepository } from '@domain/repositories';
import { InquiryId, createAuditEntryId } from '@domain/value-objects';
import { getDatabase } from './connection';

const GENESIS_HASH = '0'.repeat(64);

interface AuditRow {
  id: string;
  timestamp: string;
  event_type: string;
  actor: string;
  inquiry_id: string | null;
  payload: string;
  previous_hash: string;
  entry_hash: string;
}

function computeHash(previousHash: string, timestamp: string, eventType: string, payload: string): string {
  return crypto
    .createHash('sha256')
    .update(previousHash + timestamp + eventType + payload)
    .digest('hex');
}

function rowToEntry(row: AuditRow): AuditEntry {
  return {
    id: createAuditEntryId(row.id),
    timestamp: new Date(row.timestamp),
    eventType: row.event_type as AuditEventType,
    actor: row.actor as AuditActor,
    inquiryId: row.inquiry_id as InquiryId | null,
    payload: JSON.parse(row.payload),
    previousHash: row.previous_hash,
    entryHash: row.entry_hash,
  };
}

export class SQLiteAuditRepository implements AuditRepository {
  async append(entry: Omit<AuditEntry, 'previousHash' | 'entryHash'>): Promise<AuditEntry> {
    const db = getDatabase();
    const previousHash = await this.getLastHash();
    const timestamp = entry.timestamp.toISOString();
    const payloadStr = JSON.stringify(entry.payload);
    const entryHash = computeHash(previousHash, timestamp, entry.eventType, payloadStr);

    const fullEntry: AuditEntry = { ...entry, previousHash, entryHash };

    db.prepare(`
      INSERT INTO audit_log (id, timestamp, event_type, actor, inquiry_id, payload, previous_hash, entry_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      fullEntry.id,
      timestamp,
      fullEntry.eventType,
      fullEntry.actor,
      fullEntry.inquiryId ?? null,
      payloadStr,
      previousHash,
      entryHash,
    );

    return fullEntry;
  }

  async findByInquiryId(inquiryId: InquiryId): Promise<AuditEntry[]> {
    const db = getDatabase();
    const rows = db.prepare(
      'SELECT * FROM audit_log WHERE inquiry_id = ? ORDER BY timestamp ASC'
    ).all(inquiryId) as AuditRow[];
    return rows.map(rowToEntry);
  }

  async findAll(): Promise<AuditEntry[]> {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM audit_log ORDER BY timestamp ASC').all() as AuditRow[];
    return rows.map(rowToEntry);
  }

  async getLastHash(): Promise<string> {
    const db = getDatabase();
    const row = db.prepare(
      'SELECT entry_hash FROM audit_log ORDER BY timestamp DESC LIMIT 1'
    ).get() as { entry_hash: string } | undefined;
    return row?.entry_hash ?? GENESIS_HASH;
  }

  async verifyChain(): Promise<{ valid: boolean; firstInvalidId?: string; totalVerified: number }> {
    const entries = await this.findAll();
    let previousHash = GENESIS_HASH;
    let totalVerified = 0;

    for (const entry of entries) {
      const expected = computeHash(
        previousHash,
        entry.timestamp.toISOString(),
        entry.eventType,
        JSON.stringify(entry.payload),
      );
      if (expected !== entry.entryHash || entry.previousHash !== previousHash) {
        return { valid: false, firstInvalidId: entry.id, totalVerified };
      }
      previousHash = entry.entryHash;
      totalVerified++;
    }

    return { valid: true, totalVerified };
  }
}
