/**
 * File change tracking for agent modifications.
 * Tracks which files were created, modified, or deleted by the AI agent.
 */

export type ChangeType = 'created' | 'modified' | 'deleted' | 'unchanged';

export interface FileChange {
  path: string;
  type: ChangeType;
  timestamp: Date;
  sizeBefore?: number;
  sizeAfter?: number;
}

/**
 * Track file changes during an agent run.
 */
export class FileChangeTracker {
  private changes: FileChange[] = [];
  private baseline: Map<string, number> = new Map(); // path -> size

  /**
   * Start tracking by recording initial file state.
   */
  async startTracking(
    client: { request: <T>(m: string, p?: Record<string, unknown>) => Promise<T> },
    _workspace: string,
  ): Promise<void> {
    try {
      const files = await client.request<string[]>('fs.allFiles');
      for (const file of files) {
        try {
          const stat = await client.request<{ size?: number }>('fs.stat', { path: file });
          if (stat && typeof stat === 'object' && 'size' in stat) {
            this.baseline.set(file, stat.size as number);
          }
        } catch {
          // File might have been deleted or is inaccessible
        }
      }
    } catch (e) {
      console.error('Failed to start tracking:', e);
    }
  }

  /**
   * Record that a file was accessed or modified.
   */
  recordAccess(path: string, content?: string): void {
    const existing = this.baseline.get(path);
    const newSize = content ? content.length : undefined;
    
    if (existing === undefined) {
      // New file
      this.changes.push({
        path,
        type: 'created',
        timestamp: new Date(),
        sizeAfter: newSize,
      });
    } else if (newSize !== undefined && existing !== newSize) {
      // Modified file
      this.changes.push({
        path,
        type: 'modified',
        timestamp: new Date(),
        sizeBefore: existing,
        sizeAfter: newSize,
      });
    }
  }

  /**
   * Record that a file was deleted.
   */
  recordDeletion(path: string): void {
    this.changes.push({
      path,
      type: 'deleted',
      timestamp: new Date(),
    });
  }

  /**
   * Get all changes during this tracking session.
   */
  getChanges(): FileChange[] {
    return [...this.changes];
  }

  /**
   * Get changes filtered by type.
   */
  getChangesByType(type: ChangeType): FileChange[] {
    return this.changes.filter(c => c.type === type);
  }

  /**
   * Get changes filtered by file path pattern.
   */
  getChangesByPattern(pattern: RegExp): FileChange[] {
    return this.changes.filter(c => pattern.test(c.path));
  }

  /**
   * Get a summary of changes.
   */
  getSummary(): {
    created: number;
    modified: number;
    deleted: number;
    total: number;
  } {
    const summary: { [key: string]: number; created: number; modified: number; deleted: number; total: number } = { created: 0, modified: 0, deleted: 0, total: 0 };
    for (const change of this.changes) {
      if (change.type in summary) {
        (summary as { [key: string]: number })[change.type]++;
      }
      summary.total++;
    }
    return summary as { created: number; modified: number; deleted: number; total: number };
  }

  /**
   * Clear all tracked changes.
   */
  clear(): void {
    this.changes = [];
    this.baseline.clear();
  }

  /**
   * Export changes as JSON.
   */
  export(): string {
    return JSON.stringify(this.changes, null, 2);
  }
}

/**
 * Global file change tracker instance.
 */
export const fileChangeTracker = new FileChangeTracker();