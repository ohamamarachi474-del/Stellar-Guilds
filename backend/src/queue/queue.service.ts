import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from './queue.constants';
import { DummyJobData, EmailJobData, OnChainEventJobData } from './queue.interfaces';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.DUMMY) private readonly dummyQueue: Queue,
    @InjectQueue(QUEUE_NAMES.EMAIL) private readonly emailQueue: Queue,
    @InjectQueue(QUEUE_NAMES.ON_CHAIN_EVENTS)
    private readonly onChainEventsQueue: Queue,
  ) {}

  /**
   * Add a dummy job to the queue for testing
   */
  async addDummyJob(data: DummyJobData): Promise<void> {
    const job = await this.dummyQueue.add('dummy', data, {
      priority: data.priority || 1,
    });
    this.logger.log(`Added dummy job ${job.id} to queue`);
  }

  /**
   * Add multiple dummy jobs to the queue
   */
  async addDummyJobs(
    jobs: Array<Omit<DummyJobData, 'id' | 'createdAt'>>,
  ): Promise<void> {
    const timestamp = new Date();
    const jobPromises = jobs.map((job, index) => {
      const data: DummyJobData = {
        id: `dummy-${timestamp.getTime()}-${index}`,
        message: job.message,
        createdAt: timestamp,
        priority: job.priority,
      };
      return this.dummyQueue.add('dummy', data, {
        priority: data.priority || 1,
      });
    });

    await Promise.all(jobPromises);
    this.logger.log(`Added ${jobs.length} dummy jobs to queue`);
  }

  /**
   * Add an email job to the queue
   */
  async addEmailJob(data: EmailJobData): Promise<void> {
    const job = await this.emailQueue.add('send-email', data);
    this.logger.log(`Added email job ${job.id} to queue`);
  }

  /**
   * Add an on-chain event processing job to the queue
   */
  async addOnChainEventJob(data: OnChainEventJobData): Promise<void> {
    const job = await this.onChainEventsQueue.add('process-event', data);
    this.logger.log(`Added on-chain event job ${job.id} to queue`);
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueName: string): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }> {
    const queue =
      queueName === QUEUE_NAMES.DUMMY
        ? this.dummyQueue
        : queueName === QUEUE_NAMES.EMAIL
          ? this.emailQueue
          : this.onChainEventsQueue;

    const [waiting, active, completed, failed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
    ]);

    return { waiting, active, completed, failed };
  }

  /**
   * Get all queues statistics
   */
  async getAllQueuesStats(): Promise<Record<string, { waiting: number; active: number; completed: number; failed: number }>> {
    const [dummy, email, onChainEvents] = await Promise.all([
      this.getQueueStats(QUEUE_NAMES.DUMMY),
      this.getQueueStats(QUEUE_NAMES.EMAIL),
      this.getQueueStats(QUEUE_NAMES.ON_CHAIN_EVENTS),
    ]);

    return {
      [QUEUE_NAMES.DUMMY]: dummy,
      [QUEUE_NAMES.EMAIL]: email,
      [QUEUE_NAMES.ON_CHAIN_EVENTS]: onChainEvents,
    };
  }
}
