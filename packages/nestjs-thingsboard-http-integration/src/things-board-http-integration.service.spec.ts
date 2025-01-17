import { HttpModule } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { MODULE_OPTIONS_TOKEN } from './things-board-http-integration.module-definition';
import { ThingsBoardHttpIntegrationService } from './things-board-http-integration.service';

describe('ThingsBoardHttpIntegrationService', () => {
  let service: ThingsBoardHttpIntegrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        ThingsBoardHttpIntegrationService,
        { provide: MODULE_OPTIONS_TOKEN, useValue: {} },
      ],
    }).compile();

    service = module.get<ThingsBoardHttpIntegrationService>(
      ThingsBoardHttpIntegrationService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
