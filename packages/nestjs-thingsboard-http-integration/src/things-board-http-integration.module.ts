import { CacheableModule, CacheableService } from '@eddaic/nestjs-cacheable';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN,
} from './things-board-http-integration.module-definition';
import { ThingsBoardHttpIntegrationService } from './things-board-http-integration.service';

@Module({
  exports: [ThingsBoardHttpIntegrationService],
  imports: [
    HttpModule.registerAsync({
      imports: [CacheableModule],
      inject: [CacheableService],
      useFactory: (cacheable: CacheableService) => ({
        lookup: cacheable.lookup(),
      }),
    }),
  ],
  providers: [
    ThingsBoardHttpIntegrationService,
    { provide: MODULE_OPTIONS_TOKEN, useValue: {} },
  ],
})
export class ThingsBoardHttpIntegrationModule extends ConfigurableModuleClass {}
