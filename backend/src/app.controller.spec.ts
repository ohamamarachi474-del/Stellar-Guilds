import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {
            getHello: jest
              .fn()
              .mockReturnValue(
                'Stellar Guilds Backend - Database Integration Complete!',
              ),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return the correct welcome message', () => {
      expect(appController.getHello()).toBe(
        'Stellar Guilds Backend - Database Integration Complete!',
      );
    });
  });
});
