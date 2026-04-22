import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ErrorReportingService } from '../services/error-reporting.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly errorReportingService: ErrorReportingService,
  ) {}

  catch(exception: any, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      const response = exception.getResponse();
      message = (response as any).message || exception.message;
    } else if (
      exception &&
      typeof exception === 'object' &&
      (exception.constructor.name === 'PrismaClientKnownRequestError' ||
        exception.name === 'PrismaClientKnownRequestError')
    ) {
      // Handle Prisma errors
      switch (exception.code) {
        case 'P2002':
          httpStatus = HttpStatus.CONFLICT;
          message = `Unique constraint failed on the fields: ${(exception.meta?.target as string[])?.join(', ')}`;
          break;
        case 'P2003':
          httpStatus = HttpStatus.BAD_REQUEST;
          message = 'Foreign key constraint failed';
          break;
        case 'P2025':
          httpStatus = HttpStatus.NOT_FOUND;
          message = 'Record not found';
          break;
        default:
          httpStatus = HttpStatus.BAD_REQUEST;
          message = `Prisma error: ${exception.message}`;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const request = ctx.getRequest();
    const response = ctx.getResponse();
    const path = httpAdapter.getRequestUrl(request);

    // Report 5xx server errors to the error reporting service
    if (httpStatus >= 500) {
      try {
        const userAgent = request.headers['user-agent'];
        const ip = request.ip || request.connection.remoteAddress;
        const method = request.method;
        const userId = request.user?.userId; // If available from auth

        // Trigger error reporting asynchronously (non-blocking)
        this.errorReportingService
          .reportServerError(exception, path, method, userAgent, ip, userId)
          .catch(() => {
            // Error reporting failure should not affect the main error response
          });
      } catch (reportingError) {
        // Ensure error reporting itself doesn't cause cascade failures
        console.error('Error reporting failed:', reportingError);
      }
    }

    const responseBody = {
      statusCode: httpStatus,
      message,
      timestamp: new Date().toISOString(),
      path,
    };

    httpAdapter.reply(response, responseBody, httpStatus);
  }
}
