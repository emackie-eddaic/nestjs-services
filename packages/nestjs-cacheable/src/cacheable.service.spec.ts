import { Test, TestingModule } from '@nestjs/testing';
import { CacheableModule } from './cacheable.module';
import { CacheableService } from './cacheable.service';

describe('CacheableService', () => {
  let service: CacheableService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [CacheableModule],
      providers: [
        {
          provide: 'CONSUMER',
          inject: [CacheableService],
          useFactory: (cacheable: CacheableService) => cacheable,
        },
      ],
    }).compile();

    service = module.get<CacheableService>('CONSUMER');
  });

  afterEach(async () => {
    await module.close();
  });

  it('exports the service to importing modules', () => {
    expect(service).toBeDefined();
  });
});
