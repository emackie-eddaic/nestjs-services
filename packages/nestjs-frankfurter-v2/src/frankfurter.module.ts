import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN,
} from './frankfurter.module-definition';
import { FrankfurterService } from './frankfurter.service';

/** Import directly for defaults, or use register/registerAsync for configuration. */
@Module({
  imports: [HttpModule.register({})],
  providers: [
    FrankfurterService,
    { provide: MODULE_OPTIONS_TOKEN, useValue: {} },
  ],
  exports: [FrankfurterService],
})
export class FrankfurterModule extends ConfigurableModuleClass {}
