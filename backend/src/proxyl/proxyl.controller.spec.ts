import { Test, TestingModule } from '@nestjs/testing';
import { ProxylController } from './proxyl.controller';
import { ProxylService } from './proxyl.service';

describe('ProxylController', () => {
  let controller: ProxylController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProxylController],
      providers: [ProxylService],
    }).compile();

    controller = module.get<ProxylController>(ProxylController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
