import { Module } from '@nestjs/common';
import { MaxmindGeoip2Service } from './maxmind-geoip2.service';
import {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN,
} from './maxmind-geoip2.module-definition';

@Module({
  exports: [MaxmindGeoip2Service],
  providers: [
    MaxmindGeoip2Service,
    { provide: MODULE_OPTIONS_TOKEN, useValue: {} },
  ],
})
export class MaxmindGeoip2Module extends ConfigurableModuleClass {}
