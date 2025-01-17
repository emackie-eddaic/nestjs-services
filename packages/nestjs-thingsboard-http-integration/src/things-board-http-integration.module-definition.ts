import { ConfigurableModuleBuilder } from '@nestjs/common';
import { ThingsBoardHttpIntegrationConfiguration } from './type';

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<ThingsBoardHttpIntegrationConfiguration>({
    moduleName: 'ThingsBoardHttpIntegration',
  }).build();
