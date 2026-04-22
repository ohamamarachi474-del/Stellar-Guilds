import { Test, TestingModule } from '@nestjs/testing';
import { ErrorCacheService } from './error-cache.service';

describe('ErrorCacheService', () => {
  let service: ErrorCacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ErrorCacheService],
    }).compile();

    service = module.get<ErrorCacheService>(ErrorCacheService);
    service.clearCache(); // Start with clean cache for each test
  });

  afterEach(() => {
    service.clearCache();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should record first error occurrence', () => {
    const entry = service.recordError('Test error', '/test');

    expect(entry.count).toBe(1);
    expect(entry.message).toBe('Test error');
    expect(entry.path).toBe('/test');
    expect(entry.firstOccurrence).toBeInstanceOf(Date);
    expect(entry.lastOccurrence).toBeInstanceOf(Date);
  });

  it('should increment count for repeated errors', () => {
    // Record same error multiple times
    service.recordError('Test error', '/test');
    service.recordError('Test error', '/test');
    service.recordError('Test error', '/test');

    const entry = service.recordError('Test error', '/test');

    expect(entry.count).toBe(4);
    expect(entry.message).toBe('Test error');
    expect(entry.path).toBe('/test');
  });

  it('should treat different messages as different errors', () => {
    const entry1 = service.recordError('Error 1', '/test');
    const entry2 = service.recordError('Error 2', '/test');

    expect(entry1.count).toBe(1);
    expect(entry2.count).toBe(1);
    expect(entry1.message).not.toBe(entry2.message);
  });

  it('should treat different paths as different errors', () => {
    const entry1 = service.recordError('Same error', '/path1');
    const entry2 = service.recordError('Same error', '/path2');

    expect(entry1.count).toBe(1);
    expect(entry2.count).toBe(1);
    expect(entry1.path).toBe('/path1');
    expect(entry2.path).toBe('/path2');
  });

  it('should detect when threshold is exceeded', () => {
    // Record error 4 times
    for (let i = 0; i < 4; i++) {
      service.recordError('Threshold test', '/test');
    }

    const hasExceeded = service.hasExceededThreshold(
      'Threshold test',
      '/test',
      3,
    );

    expect(hasExceeded).toBe(true);
  });

  it('should not detect threshold exceeded for errors below threshold', () => {
    // Record error 2 times
    for (let i = 0; i < 2; i++) {
      service.recordError('Below threshold', '/test');
    }

    const hasExceeded = service.hasExceededThreshold(
      'Below threshold',
      '/test',
      3,
    );

    expect(hasExceeded).toBe(false);
  });

  it('should not detect threshold exceeded for old errors', (done) => {
    // Record error 4 times
    for (let i = 0; i < 4; i++) {
      service.recordError('Old error', '/test');
    }

    // Wait more than 1 minute (TTL)
    setTimeout(() => {
      const hasExceeded = service.hasExceededThreshold('Old error', '/test', 3);
      expect(hasExceeded).toBe(false);
      done();
    }, 1100); // Wait 1.1 seconds (using shorter TTL for testing)
  }, 2000);

  it('should return error statistics sorted by count', () => {
    // Record different errors with different frequencies
    for (let i = 0; i < 5; i++) {
      service.recordError('High frequency', '/test1');
    }

    for (let i = 0; i < 3; i++) {
      service.recordError('Medium frequency', '/test2');
    }

    for (let i = 0; i < 1; i++) {
      service.recordError('Low frequency', '/test3');
    }

    const stats = service.getErrorStats();

    expect(stats).toHaveLength(3);
    expect(stats[0].entry.count).toBe(5); // Highest count first
    expect(stats[1].entry.count).toBe(3);
    expect(stats[2].entry.count).toBe(1);

    expect(stats[0].entry.message).toBe('High frequency');
    expect(stats[1].entry.message).toBe('Medium frequency');
    expect(stats[2].entry.message).toBe('Low frequency');
  });

  it('should clear cache properly', () => {
    // Record some errors
    service.recordError('Error 1', '/test1');
    service.recordError('Error 2', '/test2');

    expect(service.getErrorStats()).toHaveLength(2);

    service.clearCache();

    expect(service.getErrorStats()).toHaveLength(0);
  });

  it('should handle errors without path', () => {
    const entry = service.recordError('Error without path');

    expect(entry.count).toBe(1);
    expect(entry.message).toBe('Error without path');
    expect(entry.path).toBeUndefined();
  });

  it('should generate consistent hashes for same error', () => {
    const entry1 = service.recordError('Same error', '/same/path');
    const entry2 = service.recordError('Same error', '/same/path');

    expect(entry1.count).toBe(1);
    expect(entry2.count).toBe(2); // Same error, incremented
  });

  it('should generate different hashes for different paths', () => {
    const entry1 = service.recordError('Same message', '/path1');
    const entry2 = service.recordError('Same message', '/path2');

    expect(entry1.count).toBe(1);
    expect(entry2.count).toBe(1); // Different paths, separate entries
  });
});
