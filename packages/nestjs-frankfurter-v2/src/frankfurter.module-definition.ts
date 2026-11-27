import { ConfigurableModuleBuilder } from '@nestjs/common';
import type { FrankfurterConfiguration } from './type';

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<FrankfurterConfiguration>({
    moduleName: 'Frankfurter',
  }).build();
