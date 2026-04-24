import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ApiKeyService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, label?: string) {
    const rawKey = randomBytes(16).toString('hex'); // 32 hex chars
    const keyHash = createHash('sha256').update(rawKey).digest('hex');

    await this.prisma.apiKey.create({ data: { userId, keyHash, label } });

    // Return raw key ONCE — never stored
    return { key: rawKey, label };
  }

  async revoke(id: string, userId: string) {
    const apiKey = await this.prisma.apiKey.findUnique({ where: { id } });
    if (!apiKey) throw new NotFoundException('API key not found');
    if (apiKey.userId !== userId) throw new ForbiddenException();

    return this.prisma.apiKey.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  async validateKey(rawKey: string) {
    const keyHash = createHash('sha256').update(rawKey).digest('hex');
    const apiKey = await this.prisma.apiKey.findUnique({ where: { keyHash } });
    if (!apiKey || apiKey.revokedAt) return null;
    return apiKey;
  }
}
