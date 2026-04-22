import { Test, TestingModule } from '@nestjs/testing';
import { ErrorReportingService } from './error-reporting.service';
import { ErrorCacheService } from './error-cache.service';

describe('ErrorReportingService', () => {
  let service: ErrorReportingService;
  let errorCache: ErrorCacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ErrorReportingService, ErrorCacheService],
    }).compile();

    service = module.get<ErrorReportingService>(ErrorReportingService);
    errorCache = module.get<ErrorCacheService>(ErrorCacheService);

    // Mock the methods we need
    (errorCache.recordError as jest.Mock).mockImplementation(
      (message, path) => ({
        count: 1,
        firstOccurrence: new Date(),
        lastOccurrence: new Date(),
        message,
        path,
      }),
    );
    (errorCache.hasExceededThreshold as jest.Mock).mockReturnValue(false);
    (errorCache.getErrorStats as jest.Mock).mockReturnValue([]);
    (errorCache.clearCache as jest.Mock).mockImplementation(() => {});

    // Mock console.log for testing
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should report 5xx server errors', async () => {
    const mockError = new Error('Database connection failed');
    const mockErrorEntry = {
      count: 1,
      firstOccurrence: new Date(),
      lastOccurrence: new Date(),
      message: 'Database connection failed',
      path: '/test',
    };

    (errorCache.recordError as jest.Mock).mockReturnValue(mockErrorEntry);
    (errorCache.hasExceededThreshold as jest.Mock).mockReturnValue(false);

    await service.reportServerError(
      mockError,
      '/test',
      'GET',
      'test-agent',
      '127.0.0.1',
      'user123',
    );

    expect(errorCache.recordError).toHaveBeenCalledWith(
      'Database connection failed',
      '/test',
    );
    expect(errorCache.hasExceededThreshold).toHaveBeenCalledWith(
      'Database connection failed',
      '/test',
      3,
    );
    expect(console.log).toHaveBeenCalledWith(
      'ERROR REPORT:',
      expect.any(String),
    );
  });

  it('should not report 4xx client errors', async () => {
    const mockError = new Error('Not found');
    mockError.name = 'NotFoundException';
    (mockError as any).getStatus = jest.fn().mockReturnValue(404);

    await service.reportServerError(
      mockError,
      '/test',
      'GET',
      'test-agent',
      '127.0.0.1',
      'user123',
    );

    expect(errorCache.recordError).not.toHaveBeenCalled();
    expect(errorCache.hasExceededThreshold).not.toHaveBeenCalled();
  });

  it('should trigger high-priority alert when threshold exceeded', async () => {
    const mockError = new Error('Database connection failed');
    const mockErrorEntry = {
      count: 4,
      firstOccurrence: new Date(Date.now() - 30000),
      lastOccurrence: new Date(),
      message: 'Database connection failed',
      path: '/test',
    };

    (errorCache.recordError as jest.Mock).mockReturnValue(mockErrorEntry);
    (errorCache.hasExceededThreshold as jest.Mock).mockReturnValue(true);

    await service.reportServerError(
      mockError,
      '/test',
      'GET',
      'test-agent',
      '127.0.0.1',
      'user123',
    );

    expect(console.log).toHaveBeenCalledWith('=== CRITICAL ERROR ALERT ===');
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('has occurred 4 times'),
    );
  });

  it('should handle reporting errors gracefully', async () => {
    const mockError = new Error('Database connection failed');

    (errorCache.recordError as jest.Mock).mockImplementation(() => {
      throw new Error('Cache service failed');
    });

    await expect(
      service.reportServerError(
        mockError,
        '/test',
        'GET',
        'test-agent',
        '127.0.0.1',
      ),
    ).resolves.toBeUndefined();

    expect(console.error).toHaveBeenCalledWith(
      'Failed to report error:',
      expect.any(Error),
    );
  });

  it('should generate unique report IDs', async () => {
    const mockError = new Error('Test error');
    const mockErrorEntry = {
      count: 1,
      firstOccurrence: new Date(),
      lastOccurrence: new Date(),
      message: 'Test error',
      path: '/test',
    };

    (errorCache.recordError as jest.Mock).mockReturnValue(mockErrorEntry);
    (errorCache.hasExceededThreshold as jest.Mock).mockReturnValue(false);

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await service.reportServerError(mockError, '/test');

    const logCall = consoleSpy.mock.calls.find(
      (call) => call[0] === 'ERROR REPORT:' && typeof call[1] === 'string',
    );

    expect(logCall).toBeDefined();

    const report = JSON.parse(logCall![1]);
    expect(report).toHaveProperty('id');
    expect(report.id).toMatch(/^[a-f0-9]{32}$/);
  });

  it('should include all required fields in error report', async () => {
    const mockError = new Error('Test error with stack');
    mockError.stack = 'Error: Test error\n    at test.js:1:1';

    const mockErrorEntry = {
      count: 2,
      firstOccurrence: new Date(Date.now() - 60000),
      lastOccurrence: new Date(),
      message: 'Test error with stack',
      path: '/api/test',
    };

    (errorCache.recordError as jest.Mock).mockReturnValue(mockErrorEntry);
    (errorCache.hasExceededThreshold as jest.Mock).mockReturnValue(false);

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await service.reportServerError(
      mockError,
      '/api/test',
      'POST',
      'Mozilla/5.0',
      '192.168.1.1',
      'user456',
    );

    const logCall = consoleSpy.mock.calls.find(
      (call) => call[0] === 'ERROR REPORT:' && typeof call[1] === 'string',
    );

    const report = JSON.parse(logCall![1]);

    expect(report).toMatchObject({
      id: expect.any(String),
      timestamp: expect.any(String),
      severity: 'HIGH',
      message: 'Test error with stack',
      stack: 'Error: Test error\n    at test.js:1:1',
      path: '/api/test',
      method: 'POST',
      userAgent: 'Mozilla/5.0',
      ip: '192.168.1.1',
      userId: 'user456',
      occurrenceCount: 2,
      environment: 'test',
      service: 'stellar-guilds-backend',
    });

    expect(report).toHaveProperty('firstOccurrence');
    expect(report).toHaveProperty('lastOccurrence');
  });
});
