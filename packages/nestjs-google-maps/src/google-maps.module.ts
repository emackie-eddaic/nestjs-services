import { Module } from '@nestjs/common';
import {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN,
} from './google-maps.module-definition';
import { GoogleMapsService } from './google-maps.service';
import { GoogleMapsConfiguration } from './type';

const defaultConfig: GoogleMapsConfiguration = {};

/**
 * Provides {@link GoogleMapsService} using the official Google Maps client.
 *
 * @remarks
 * Use `register` for synchronous configuration or `registerAsync` to resolve
 * configuration through Nest dependency injection.
 */
@Module({
  exports: [GoogleMapsService],
  providers: [
    GoogleMapsService,
    { provide: MODULE_OPTIONS_TOKEN, useValue: defaultConfig },
  ],
})
export class GoogleMapsModule extends ConfigurableModuleClass {}
