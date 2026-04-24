import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ApiKeyService } from '../services/api-key.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const rawKey = request.headers['x-api-key'];
    if (!rawKey) throw new UnauthorizedException('Missing X-API-KEY header');

    const apiKey = await this.apiKeyService.validateKey(rawKey);
    if (!apiKey) throw new UnauthorizedException('Invalid or revoked API key');

    request.apiKeyUserId = apiKey.userId;
    return true;
  }
}
