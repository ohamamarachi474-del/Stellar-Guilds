import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { BountyController } from './bounty.controller';
import { BountyService } from './bounty.service';

describe('BountyController', () => {
  let controller: BountyController;
  let service: {
    submitWork: jest.Mock;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BountyController],
      providers: [
        {
          provide: BountyService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            search: jest.fn(),
            update: jest.fn(),
            cancel: jest.fn(),
            apply: jest.fn(),
            listApplications: jest.fn(),
            reviewApplication: jest.fn(),
            createMilestone: jest.fn(),
            completeMilestone: jest.fn(),
            approveMilestone: jest.fn(),
            submitWork: jest.fn(),
            reviewWork: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(BountyController);
    service = module.get(BountyService);
  });

  describe('submitWork', () => {
    it('forwards the assignee submission to the service', async () => {
      service.submitWork.mockResolvedValue({
        bounty: { id: 'bounty-1', status: 'IN_REVIEW' },
      });

      const result = await controller.submitWork(
        'bounty-1',
        {
          submissions: [
            { prUrl: 'https://example.com/submission', description: 'desc' },
          ],
        },
        { user: { userId: 'worker-1' } },
      );

      expect(service.submitWork).toHaveBeenCalledWith(
        'bounty-1',
        {
          submissions: [
            { prUrl: 'https://example.com/submission', description: 'desc' },
          ],
        },
        'worker-1',
      );
      expect(result).toEqual({
        bounty: { id: 'bounty-1', status: 'IN_REVIEW' },
      });
    });

    it('propagates a 403 when a different user submits work', async () => {
      service.submitWork.mockRejectedValue(
        new ForbiddenException('Only the assigned user can submit work'),
      );

      await expect(
        controller.submitWork(
          'bounty-1',
          {
            submissions: [
              { prUrl: 'https://example.com/submission', description: 'desc' },
            ],
          },
          { user: { userId: 'intruder-1' } },
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
