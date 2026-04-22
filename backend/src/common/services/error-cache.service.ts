import { Injectable } from '@nestjs/common';

interface ErrorEntry {
  count: number;
  firstOccurrence: Date;
  lastOccurrence: Date;
  message: string;
  path?: string;
}

@Injectable()
export class ErrorCacheService {
  private errorCache = new Map<string, ErrorEntry>();
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly ERROR_TTL = 60 * 1000; // 1 minute

  constructor() {
    // Start cleanup interval
    setInterval(() => {
      this.cleanup();
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Generate a hash for the error message for grouping similar errors
   */
  private generateErrorHash(message: string, path?: string): string {
    const crypto = require('crypto');
    const content = `${message}:${path || 'no-path'}`;
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * Record an error occurrence
   */
  recordError(message: string, path?: string): ErrorEntry {
    const hash = this.generateErrorHash(message, path);
    const now = new Date();

    if (this.errorCache.has(hash)) {
      const existing = this.errorCache.get(hash)!;
      existing.count++;
      existing.lastOccurrence = now;
      return existing;
    } else {
      const entry: ErrorEntry = {
        count: 1,
        firstOccurrence: now,
        lastOccurrence: now,
        message,
        path,
      };
      this.errorCache.set(hash, entry);
      return entry;
    }
  }

  /**
   * Check if an error has occurred more than threshold times in the last minute
   */
  hasExceededThreshold(
    message: string,
    path?: string,
    threshold: number = 3,
  ): boolean {
    const hash = this.generateErrorHash(message, path);
    const entry = this.errorCache.get(hash);

    if (!entry) {
      return false;
    }

    const oneMinuteAgo = new Date(Date.now() - this.ERROR_TTL);
    return entry.count >= threshold && entry.lastOccurrence > oneMinuteAgo;
  }

  /**
   * Get error statistics for reporting
   */
  getErrorStats(): Array<{ hash: string; entry: ErrorEntry }> {
    const stats: Array<{ hash: string; entry: ErrorEntry }> = [];

    for (const [hash, entry] of this.errorCache.entries()) {
      stats.push({ hash, entry });
    }

    return stats.sort((a, b) => b.entry.count - a.entry.count);
  }

  /**
   * Clean up old error entries (older than TTL)
   */
  private cleanup(): void {
    const cutoff = new Date(Date.now() - this.ERROR_TTL);

    for (const [hash, entry] of this.errorCache.entries()) {
      if (entry.lastOccurrence < cutoff) {
        this.errorCache.delete(hash);
      }
    }
  }

  /**
   * Clear all error cache (useful for testing)
   */
  clearCache(): void {
    this.errorCache.clear();
  }
}
