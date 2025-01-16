import { Test, TestingModule } from '@nestjs/testing';
import { CacheableService } from './cacheable.service';

describe('CacheableService', () => {
  let service: CacheableService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CacheableService],
    }).compile();

    service = module.get<CacheableService>(CacheableService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
