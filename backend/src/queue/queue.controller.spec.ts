import { Test, TestingModule } from '@nestjs/testing';
import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';
import { QUEUE_NAMES } from './queue.constants';

describe('QueueController', () => {
  let controller: QueueController;
  let service: QueueService;

  const mockQueueService = {
    addDummyJobs: jest.fn(),
    getQueueStats: jest.fn().mockResolvedValue({
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
    }),
    getAllQueuesStats: jest.fn().mockResolvedValue({
      [QUEUE_NAMES.DUMMY]: { waiting: 0, active: 0, completed: 0, failed: 0 },
      [QUEUE_NAMES.EMAIL]: { waiting: 0, active: 0, completed: 0, failed: 0 },
      [QUEUE_NAMES.ON_CHAIN_EVENTS]: { waiting: 0, active: 0, completed: 0, failed: 0 },
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QueueController],
      providers: [
        {
          provide: QueueService,
          useValue: mockQueueService,
        },
      ],
    }).compile();

    controller = module.get<QueueController>(QueueController);
    service = module.get<QueueService>(QueueService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('queueDummyJobs', () => {
    it('should queue 1 job by default', async () => {
      const result = await controller.queueDummyJobs({ count: 1 });

      expect(result.message).toBe('Successfully queued 1 dummy jobs');
      expect(result.count).toBe(1);
      expect(service.addDummyJobs).toHaveBeenCalledTimes(1);
    });

    it('should queue specified number of jobs', async () => {
      const result = await controller.queueDummyJobs({ count: 5 });

      expect(result.count).toBe(5);
      expect(service.addDummyJobs).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ message: expect.any(String) }),
        ]),
      );
    });

    it('should use custom message when provided', async () => {
      await controller.queueDummyJobs({ count: 2, message: 'Custom' });

      expect(service.addDummyJobs).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ message: 'Custom #1' }),
          expect.objectContaining({ message: 'Custom #2' }),
        ]),
      );
    });
  });

  describe('getQueueStats', () => {
    it('should return all queue statistics', async () => {
      const result = await controller.getQueueStats();

      expect(service.getAllQueuesStats).toHaveBeenCalled();
      expect(result).toHaveProperty(QUEUE_NAMES.DUMMY);
      expect(result).toHaveProperty(QUEUE_NAMES.EMAIL);
      expect(result).toHaveProperty(QUEUE_NAMES.ON_CHAIN_EVENTS);
    });
  });

  describe('getSpecificQueueStats', () => {
    it('should return statistics for specific queue', async () => {
      const result = await controller.getSpecificQueueStats(QUEUE_NAMES.DUMMY);

      expect(service.getQueueStats).toHaveBeenCalledWith(QUEUE_NAMES.DUMMY);
      expect(result).toEqual({
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
      });
    });
  });
});
