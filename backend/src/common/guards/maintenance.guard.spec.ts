import { Test, TestingModule } from '@nestjs/testing';
import { MaintenanceGuard } from './maintenance.guard';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../services/redis.service';
import { ExecutionContext, ServiceUnavailableException } from '@nestjs/common';

describe('MaintenanceGuard', () => {
  let guard: MaintenanceGuard;
  let configService: ConfigService;
  let redisService: RedisService;

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockRedisService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaintenanceGuard,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    guard = module.get<MaintenanceGuard>(MaintenanceGuard);
    configService = module.get<ConfigService>(ConfigService);
    redisService = module.get<RedisService>(RedisService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    let mockRequest: any;
    let mockResponse: any;
    let mockContext: any;

    beforeEach(() => {
      mockRequest = {
        method: 'POST',
        ip: '127.0.0.1',
        headers: {},
        connection: { remoteAddress: '127.0.0.1' },
      };
      mockResponse = {
        header: jest.fn(),
      };
      mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
          getResponse: () => mockResponse,
        }),
      };
    });

    it('should allow GET requests even if maintenance is on', async () => {
      mockRequest.method = 'GET';
      mockConfigService.get.mockReturnValue('true');

      const result = await guard.canActivate(mockContext as ExecutionContext);
      expect(result).toBe(true);
    });

    it('should allow POST requests if maintenance is off', async () => {
      mockConfigService.get.mockImplementation((key) => {
        if (key === 'API_MAINTENANCE_MODE') return 'false';
        return null;
      });
      mockRedisService.get.mockResolvedValue('false');

      const result = await guard.canActivate(mockContext as ExecutionContext);
      expect(result).toBe(true);
    });

    it('should throw ServiceUnavailableException if maintenance is on via ENV', async () => {
      mockConfigService.get.mockImplementation((key) => {
        if (key === 'API_MAINTENANCE_MODE') return 'true';
        return null;
      });

      await expect(guard.canActivate(mockContext as ExecutionContext)).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('should throw ServiceUnavailableException if maintenance is on via Redis', async () => {
      mockConfigService.get.mockImplementation((key) => {
        if (key === 'API_MAINTENANCE_MODE') return 'false';
        return null;
      });
      mockRedisService.get.mockResolvedValue('true');

      await expect(guard.canActivate(mockContext as ExecutionContext)).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('should allow bypass via IP', async () => {
      mockConfigService.get.mockImplementation((key) => {
        if (key === 'API_MAINTENANCE_MODE') return 'true';
        if (key === 'MAINTENANCE_ALLOWED_IPS') return '127.0.0.1,192.168.1.1';
        return null;
      });

      const result = await guard.canActivate(mockContext as ExecutionContext);
      expect(result).toBe(true);
    });

    it('should allow bypass via Header', async () => {
      mockConfigService.get.mockImplementation((key) => {
        if (key === 'API_MAINTENANCE_MODE') return 'true';
        if (key === 'MAINTENANCE_BYPASS_KEY') return 'secret-key';
        return null;
      });

      mockRequest.headers = { 'x-maintenance-bypass': 'secret-key' };

      const result = await guard.canActivate(mockContext as ExecutionContext);
      expect(result).toBe(true);
    });
  });
});
