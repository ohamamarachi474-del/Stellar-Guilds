import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { QUEUE_NAMES } from '../queue/queue.constants';
import { TreasuryService } from './treasury.service';

export interface TreasuryTransferJobData {
  eventType: 'TREASURY_TRANSFER';
  guildId: string;
  amount: string;
  asset: string;
  fromAddress: string;
  toAddress: string;
  txHash: string;
  timestamp: string;
  blockHeight: number;
}

@Processor(QUEUE_NAMES.ON_CHAIN_EVENTS)
export class TreasuryEventProcessor extends WorkerHost {
  private readonly logger = new Logger(TreasuryEventProcessor.name);

  constructor(private treasuryService: TreasuryService) {
    super();
  }

  async process(job: Job<TreasuryTransferJobData>): Promise<any> {
    this.logger.log(`Processing treasury event job ${job.id}`);

    try {
      const {
        eventType,
        guildId,
        amount,
        asset,
        fromAddress,
        toAddress,
        txHash,
        timestamp,
      } = job.data;

      if (eventType !== 'TREASURY_TRANSFER') {
        this.logger.warn(`Unknown event type: ${eventType}`);
        return;
      }

      // Record the treasury transfer
      await this.treasuryService.recordTreasuryTransfer({
        guildId,
        amount,
        asset,
        fromAddress,
        toAddress,
        txHash,
        timestamp,
      });

      this.logger.log(`Successfully processed treasury transfer ${txHash}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to process treasury event job ${job.id}: ${errorMessage}`,
      );
      throw error;
    }
  }
}
