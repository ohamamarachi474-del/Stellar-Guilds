import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface TreasuryTransferEvent {
  guildId: string;
  amount: string;
  asset: string;
  fromAddress: string;
  toAddress: string;
  txHash: string;
  timestamp: string;
}

@Injectable()
export class TreasuryService {
  private readonly logger = new Logger(TreasuryService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Record a treasury transfer event with idempotency check
   * Duplicate transaction hashes will be handled gracefully
   */
  async recordTreasuryTransfer(event: TreasuryTransferEvent) {
    try {
      // Check if transaction already exists (idempotency)
      const existing = await this.prisma.treasuryTransaction.findUnique({
        where: { txHash: event.txHash },
      });

      if (existing) {
        this.logger.log(
          `Transaction ${event.txHash} already recorded, skipping`,
        );
        return existing;
      }

      // Record the new transaction
      const transaction = await this.prisma.treasuryTransaction.create({
        data: {
          guildId: event.guildId,
          amount: event.amount,
          asset: event.asset,
          fromAddress: event.fromAddress,
          toAddress: event.toAddress,
          txHash: event.txHash,
          timestamp: new Date(event.timestamp),
        },
      });

      this.logger.log(
        `Recorded treasury transaction ${event.txHash} for guild ${event.guildId}`,
      );

      return transaction;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to record treasury transaction ${event.txHash}: ${errorMessage}`,
      );
      throw error;
    }
  }

  /**
   * Get treasury transactions for a guild
   */
  async getGuildTransactions(guildId: string, skip = 0, take = 20) {
    const [transactions, total] = await Promise.all([
      this.prisma.treasuryTransaction.findMany({
        where: { guildId },
        skip,
        take,
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.treasuryTransaction.count({ where: { guildId } }),
    ]);

    return {
      data: transactions,
      total,
      skip,
      take,
    };
  }

  /**
   * Get a specific transaction by txHash
   */
  async getTransactionByHash(txHash: string) {
    return this.prisma.treasuryTransaction.findUnique({
      where: { txHash },
    });
  }
}
