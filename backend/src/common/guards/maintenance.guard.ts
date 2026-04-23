import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../services/redis.service';

@Injectable()
export class MaintenanceGuard implements CanActivate {
  constructor(
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // 1. Always allow GET requests
    if (request.method === 'GET') {
      return true;
    }

    // 2. Check if maintenance mode is enabled
    const isMaintenanceMode = await this.checkMaintenanceMode();
    if (!isMaintenanceMode) {
      return true;
    }

    // 3. Check for bypass mechanisms (Super Admin)
    
    // 3a. Bypass by IP
    const allowedIps = (this.configService.get<string>('MAINTENANCE_ALLOWED_IPS') || '').split(',');
    const clientIp = request.ip || request.connection?.remoteAddress;
    if (allowedIps.includes(clientIp)) {
      return true;
    }

    // 3b. Bypass by secret key header
    const bypassKey = this.configService.get<string>('MAINTENANCE_BYPASS_KEY');
    const requestBypassKey = request.headers['x-maintenance-bypass'];
    if (bypassKey && requestBypassKey === bypassKey) {
      return true;
    }

    // 4. Reject the request
    const response = context.switchToHttp().getResponse();
    response.header('Retry-After', '3600'); // Default retry after 1 hour

    throw new ServiceUnavailableException({
      statusCode: 503,
      message: 'Maintenance in progress. Please try again later.',
      error: 'Service Unavailable',
    });
  }

  private async checkMaintenanceMode(): Promise<boolean> {
    // Check environment variable first (local override)
    const envMaintenanceMode = this.configService.get<string>('API_MAINTENANCE_MODE');
    if (envMaintenanceMode === 'true') {
      return true;
    }

    // Check Redis
    try {
      const redisMaintenanceMode = await this.redisService.get('API_MAINTENANCE_MODE');
      return redisMaintenanceMode === 'true';
    } catch (error) {
      // If Redis is down, we default to allowing traffic (fail-open) 
      // unless the env var was set.
      return false;
    }
  }
}
