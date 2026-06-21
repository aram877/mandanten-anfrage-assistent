import path from 'path';
import fs from 'fs';
import { getDatabase } from './connection';

export function runMigrations(): void {
  const db = getDatabase();
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `);

  for (const file of files) {
    const row = db.prepare('SELECT filename FROM _migrations WHERE filename = ?').get(file);
    if (!row) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      db.exec(sql);
      db.prepare('INSERT INTO _migrations (filename, applied_at) VALUES (?, ?)').run(file, new Date().toISOString());
      console.log(`Applied migration: ${file}`);
    }
  }
}
