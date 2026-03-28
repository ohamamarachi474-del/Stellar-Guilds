import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from '../queue.constants';
import { DummyJobData } from '../queue.interfaces';

@Processor(QUEUE_NAMES.DUMMY, {
  concurrency: 2,
  limiter: {
    max: 10,
    duration: 1000,
  },
})
export class DummyProcessor extends WorkerHost {
  private readonly logger = new Logger(DummyProcessor.name);

  async process(job: Job<DummyJobData>): Promise<void> {
    this.logger.log(
      `Processing job ${job.id} with data: ${JSON.stringify(job.data)}`,
    );

    // Simulate async work
    await this.simulateWork(job.data);

    this.logger.log(`Job ${job.id} completed successfully`);
  }

  private async simulateWork(data: DummyJobData): Promise<void> {
    // Simulate variable processing time (100ms - 500ms)
    const processingTime = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, processingTime));

    this.logger.debug(
      `Processed dummy job ${data.id}: "${data.message}" in ${processingTime}ms`,
    );
  }

  @OnWorkerEvent('active')
  onActive(job: Job<DummyJobData>) {
    this.logger.debug(`Job ${job.id} is now active`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<DummyJobData>) {
    this.logger.debug(`Job ${job.id} has completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<DummyJobData>, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`);
  }
}
