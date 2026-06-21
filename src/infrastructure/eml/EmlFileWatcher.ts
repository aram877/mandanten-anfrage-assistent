import chokidar from 'chokidar';
import path from 'path';
import fs from 'fs';

export type EmlFileHandler = (filePath: string) => Promise<void>;

export class EmlFileWatcher {
  private readonly inboxPath: string;
  private watcher: ReturnType<typeof chokidar.watch> | null = null;

  constructor(inboxPath?: string) {
    this.inboxPath = path.resolve(inboxPath ?? process.env.INBOX_PATH ?? './data/inbox');
  }

  start(handler: EmlFileHandler): void {
    if (!fs.existsSync(this.inboxPath)) {
      fs.mkdirSync(this.inboxPath, { recursive: true });
    }

    this.watcher = chokidar.watch(this.inboxPath, {
      ignored: (filePath: string) => {
        const base = path.basename(filePath);
        const dir = path.dirname(filePath);
        // Ignore failed/ subdirectory and non-.eml files
        if (dir.includes('failed')) return true;
        if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) return false;
        return !base.endsWith('.eml');
      },
      persistent: true,
      ignoreInitial: false,
      awaitWriteFinish: { stabilityThreshold: 500, pollInterval: 100 },
    });

    this.watcher.on('add', (filePath: string) => {
      handler(filePath).catch(err => {
        console.error(`[EmlFileWatcher] Error processing ${filePath}:`, err);
      });
    });

    this.watcher.on('error', (err: unknown) => {
      console.error('[EmlFileWatcher] Watcher error:', err);
    });
  }

  stop(): void {
    this.watcher?.close();
    this.watcher = null;
  }

  moveToFailed(filePath: string): void {
    const failedDir = path.join(this.inboxPath, 'failed');
    if (!fs.existsSync(failedDir)) {
      fs.mkdirSync(failedDir, { recursive: true });
    }
    const dest = path.join(failedDir, path.basename(filePath));
    fs.renameSync(filePath, dest);
  }
}
