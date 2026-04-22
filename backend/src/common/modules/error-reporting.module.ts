import { Module } from '@nestjs/common';
import { ErrorCacheService } from '../services/error-cache.service';
import { ErrorReportingService } from '../services/error-reporting.service';

@Module({
  providers: [ErrorCacheService, ErrorReportingService],
  exports: [ErrorCacheService, ErrorReportingService],
})
export class ErrorReportingModule {}
