import { Test, TestingModule } from '@nestjs/testing';
import { ProxylService } from './proxyl.service';

describe('ProxylService', () => {
  let service: ProxylService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProxylService],
    }).compile();

    service = module.get<ProxylService>(ProxylService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
