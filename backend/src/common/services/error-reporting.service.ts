import { Injectable, Logger } from '@nestjs/common';
import { ErrorCacheService } from './error-cache.service';

export interface ErrorReport {
  id: string;
  timestamp: string;
  severity: 'HIGH' | 'CRITICAL' | 'MEDIUM';
  message: string;
  stack?: string;
  path?: string;
  method?: string;
  userAgent?: string;
  ip?: string;
  userId?: string;
  occurrenceCount: number;
  firstOccurrence: string;
  lastOccurrence: string;
  environment: string;
  service: 'stellar-guilds-backend';
}

@Injectable()
export class ErrorReportingService {
  private readonly logger = new Logger(ErrorReportingService.name);

  constructor(private readonly errorCache: ErrorCacheService) {}

  /**
   * Create a detailed error report for 5xx server errors
   */
  async reportServerError(
    exception: any,
    path?: string,
    method?: string,
    userAgent?: string,
    ip?: string,
    userId?: string,
  ): Promise<void> {
    try {
      // Only report 5xx server errors
      const statusCode = this.getStatusCode(exception);
      if (statusCode < 500) {
        return;
      }

      const message = this.getErrorMessage(exception);
      const stack = this.getStackTrace(exception);

      // Record the error in cache
      const errorEntry = this.errorCache.recordError(message, path);

      // Check if this error has exceeded threshold
      const isHighPriority = this.errorCache.hasExceededThreshold(
        message,
        path,
        3,
      );

      // Create detailed report
      const report: ErrorReport = {
        id: this.generateReportId(),
        timestamp: new Date().toISOString(),
        severity: isHighPriority ? 'CRITICAL' : 'HIGH',
        message,
        stack,
        path,
        method,
        userAgent,
        ip,
        userId,
        occurrenceCount: errorEntry.count,
        firstOccurrence: errorEntry.firstOccurrence.toISOString(),
        lastOccurrence: errorEntry.lastOccurrence.toISOString(),
        environment: process.env.NODE_ENV || 'development',
        service: 'stellar-guilds-backend',
      };

      // Log the error report JSON to console (for testing/admin review)
      this.logger.error('ERROR REPORT:', JSON.stringify(report, null, 2));
      console.log('ERROR REPORT:', JSON.stringify(report, null, 2));

      // Trigger high-priority alert if threshold exceeded
      if (isHighPriority) {
        await this.triggerHighPriorityAlert(report);
      }
    } catch (reportingError) {
      // Prevent cascade failures - wrap reporting logic in error handler
      this.logger.error('Failed to report error:', reportingError);
      this.logger.error('Original error that failed to report:', exception);
      console.error('Failed to report error:', reportingError);
    }
  }

  /**
   * Trigger high-priority alert action
   */
  private async triggerHighPriorityAlert(report: ErrorReport): Promise<void> {
    try {
      // Log high-priority alert
      this.logger.error(
        'HIGH PRIORITY ALERT TRIGGERED:',
        JSON.stringify(
          {
            alert: 'CRITICAL_ERROR_THRESHOLD_EXCEEDED',
            report,
            timestamp: new Date().toISOString(),
          },
          null,
          2,
        ),
      );

      // In production, this would send email, Slack notification, or dashboard alert
      // For now, we'll log to console as specified
      console.log('=== CRITICAL ERROR ALERT ===');
      console.log(
        `Error "${report.message}" has occurred ${report.occurrenceCount} times`,
      );
      console.log(`Last occurrence: ${report.lastOccurrence}`);
      console.log(`Path: ${report.path}`);
      console.log('Full report:', JSON.stringify(report, null, 2));
      console.log('=== END ALERT ===');

      // TODO: Add email notification integration
      // TODO: Add dashboard notification integration
    } catch (alertError) {
      this.logger.error('Failed to trigger high-priority alert:', alertError);
    }
  }

  /**
   * Extract HTTP status code from exception
   */
  private getStatusCode(exception: any): number {
    if (exception && typeof exception.getStatus === 'function') {
      return exception.getStatus();
    }

    // Check for Prisma errors
    if (
      exception &&
      typeof exception === 'object' &&
      (exception.constructor.name === 'PrismaClientKnownRequestError' ||
        exception.name === 'PrismaClientKnownRequestError')
    ) {
      // Prisma errors are typically 4xx, not 5xx
      return 400;
    }

    // Default to 500 for unhandled exceptions
    return 500;
  }

  /**
   * Extract error message from exception
   */
  private getErrorMessage(exception: any): string {
    if (exception instanceof Error) {
      return exception.message;
    }

    if (typeof exception === 'string') {
      return exception;
    }

    if (exception && typeof exception === 'object') {
      return exception.message || JSON.stringify(exception);
    }

    return 'Unknown error occurred';
  }

  /**
   * Extract stack trace from exception
   */
  private getStackTrace(exception: any): string | undefined {
    if (exception instanceof Error) {
      return exception.stack;
    }

    return undefined;
  }

  /**
   * Generate unique report ID
   */
  private generateReportId(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Get current error statistics
   */
  getErrorStatistics(): any {
    return this.errorCache.getErrorStats();
  }
}
