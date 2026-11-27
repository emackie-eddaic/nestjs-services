import { Module } from '@nestjs/common';
import {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN,
} from './google-places.module-definition';
import { GooglePlacesService } from './google-places.service';
import type { GooglePlacesConfiguration } from './type';

const defaultConfig: GooglePlacesConfiguration = {};

/**
 * Provides `GooglePlacesService` through Nest dependency injection.
 *
 * @remarks
 * Use `register` for synchronous options or `registerAsync` for injected options.
 * A bare module import uses the official client's defaults.
 */
@Module({
  exports: [GooglePlacesService],
  providers: [
    GooglePlacesService,
    { provide: MODULE_OPTIONS_TOKEN, useValue: defaultConfig },
  ],
})
export class GooglePlacesModule extends ConfigurableModuleClass {}
