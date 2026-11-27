import { ConfigurableModuleBuilder } from '@nestjs/common';
import type { GooglePlacesConfiguration } from './type';

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<GooglePlacesConfiguration>({
    moduleName: 'GooglePlaces',
  }).build();
