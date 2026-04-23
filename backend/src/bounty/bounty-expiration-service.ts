// bounty-expiration.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

// ─── Mock DB ─────────────────────────────────────────────────────────────────
interface Bounty {
  id: string;
  status: string;
  expiresAt: Date;
}

const mockDB: Bounty[] = [
  { id: 'b1', status: 'OPEN', expiresAt: new Date(Date.now() - 60_000) }, // already expired
  { id: 'b2', status: 'OPEN', expiresAt: new Date(Date.now() + 60_000) }, // future
  { id: 'b3', status: 'OPEN', expiresAt: new Date(Date.now() - 5_000) }, // already expired
];

async function findExpiredBounties(): Promise<Bounty[]> {
  const now = new Date();
  return mockDB.filter((b) => b.status === 'OPEN' && b.expiresAt < now);
}

async function markExpired(ids: string[]): Promise<void> {
  mockDB.forEach((b) => {
    if (ids.includes(b.id)) b.status = 'EXPIRED';
  });
}

// ─── Service ─────────────────────────────────────────────────────────────────
@Injectable()
export class BountyExpirationService {
  private readonly logger = new Logger(BountyExpirationService.name);

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleExpiredBounties(): Promise<void> {
    const expired = await findExpiredBounties();

    if (expired.length === 0) {
      this.logger.log('Expiration run: no bounties to expire.');
      return;
    }

    await markExpired(expired.map((b) => b.id));
    this.logger.log(
      `Processed ${expired.length} expired bounties: [${expired.map((b) => b.id).join(', ')}]`,
    );
  }
}
