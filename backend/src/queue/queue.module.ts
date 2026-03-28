import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QUEUE_NAMES } from './queue.constants';
import { DummyProcessor } from './processors/dummy.processor';
import { QueueService } from './queue.service';
import { QueueController } from './queue.controller';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD'),
          username: configService.get<string>('REDIS_USERNAME'),
          db: configService.get<number>('REDIS_DB', 0),
          maxRetriesPerRequest: null,
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: {
            age: 3600, // Keep completed jobs for 1 hour
            count: 100, // Keep max 100 completed jobs
          },
          removeOnFail: {
            age: 24 * 3600, // Keep failed jobs for 24 hours
          },
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      {
        name: QUEUE_NAMES.DUMMY,
      },
      {
        name: QUEUE_NAMES.EMAIL,
      },
      {
        name: QUEUE_NAMES.ON_CHAIN_EVENTS,
      },
    ),
  ],
  controllers: [QueueController],
  providers: [QueueService, DummyProcessor],
  exports: [QueueService, BullModule],
})
export class QueueModule {}
