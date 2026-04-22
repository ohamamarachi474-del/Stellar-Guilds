import { Test, TestingModule } from '@nestjs/testing';
import { QueueService } from './queue.service';
import { QUEUE_NAMES } from './queue.constants';
import { getQueueToken } from '@nestjs/bullmq';

describe('QueueService', () => {
  let service: QueueService;
  let dummyQueue: { add: jest.Mock };
  let emailQueue: { add: jest.Mock };
  let onChainEventsQueue: { add: jest.Mock };

  beforeEach(async () => {
    const mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 'test-job-id' }),
      getWaitingCount: jest.fn().mockResolvedValue(0),
      getActiveCount: jest.fn().mockResolvedValue(0),
      getCompletedCount: jest.fn().mockResolvedValue(0),
      getFailedCount: jest.fn().mockResolvedValue(0),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        {
          provide: getQueueToken(QUEUE_NAMES.DUMMY),
          useValue: mockQueue,
        },
        {
          provide: getQueueToken(QUEUE_NAMES.EMAIL),
          useValue: mockQueue,
        },
        {
          provide: getQueueToken(QUEUE_NAMES.ON_CHAIN_EVENTS),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<QueueService>(QueueService);
    dummyQueue = module.get(getQueueToken(QUEUE_NAMES.DUMMY));
    emailQueue = module.get(getQueueToken(QUEUE_NAMES.EMAIL));
    onChainEventsQueue = module.get(getQueueToken(QUEUE_NAMES.ON_CHAIN_EVENTS));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addDummyJob', () => {
    it('should add a dummy job to the queue', async () => {
      const data = {
        id: 'test-1',
        message: 'Test message',
        createdAt: new Date(),
        priority: 1,
      };

      await service.addDummyJob(data);

      expect(dummyQueue.add).toHaveBeenCalledWith('dummy', data, {
        priority: 1,
      });
    });
  });

  describe('addDummyJobs', () => {
    it('should add multiple dummy jobs to the queue', async () => {
      const jobs = [
        { message: 'Job 1' },
        { message: 'Job 2' },
        { message: 'Job 3' },
      ];

      await service.addDummyJobs(jobs);

      expect(dummyQueue.add).toHaveBeenCalledTimes(3);
    });
  });

  describe('addEmailJob', () => {
    it('should add an email job to the queue', async () => {
      const data = {
        to: 'test@example.com',
        subject: 'Test Subject',
        body: 'Test body',
      };

      await service.addEmailJob(data);

      expect(emailQueue.add).toHaveBeenCalledWith('send-email', data);
    });
  });

  describe('addOnChainEventJob', () => {
    it('should add an on-chain event job to the queue', async () => {
      const data = {
        txHash: '0x123',
        eventType: 'Transfer',
        payload: { amount: 100 },
        blockHeight: 12345,
      };

      await service.addOnChainEventJob(data);

      expect(onChainEventsQueue.add).toHaveBeenCalledWith(
        'process-event',
        data,
      );
    });
  });

  describe('getQueueStats', () => {
    it('should return queue statistics', async () => {
      const stats = await service.getQueueStats(QUEUE_NAMES.DUMMY);

      expect(stats).toEqual({
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
      });
    });
  });

  describe('getAllQueuesStats', () => {
    it('should return statistics for all queues', async () => {
      const stats = await service.getAllQueuesStats();

      expect(stats).toHaveProperty(QUEUE_NAMES.DUMMY);
      expect(stats).toHaveProperty(QUEUE_NAMES.EMAIL);
      expect(stats).toHaveProperty(QUEUE_NAMES.ON_CHAIN_EVENTS);
    });
  });
});
