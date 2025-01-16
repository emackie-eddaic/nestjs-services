import { ConfigurableModuleBuilder } from '@nestjs/common';
import { MaxmindGeoip2Configuration } from './type';

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<MaxmindGeoip2Configuration>({
    moduleName: 'MaxmindGeoip2',
  }).build();
