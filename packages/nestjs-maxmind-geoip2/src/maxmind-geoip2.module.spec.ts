import { WebServiceClient } from '@maxmind/geoip2-node';
import { Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MaxmindGeoip2Module } from './maxmind-geoip2.module';
import { MaxmindGeoip2Service } from './maxmind-geoip2.service';
import type { MaxmindGeoip2Configuration } from './type';

jest.mock('@maxmind/geoip2-node', () => ({
  WebServiceClient: jest.fn(),
}));

describe('MaxmindGeoip2Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(['sync', 'async'] as const)(
    'exports the service with %s configuration',
    async (registration) => {
      const configuration: MaxmindGeoip2Configuration = {
        accountId: 'test-account',
        licenseKey: 'test-license',
        options: { timeout: 1000 },
      };
      @Module({
        providers: [{ provide: 'CONFIGURATION', useValue: configuration }],
        exports: ['CONFIGURATION'],
      })
      class ConfigurationModule {}

      const imported =
        registration === 'sync'
          ? MaxmindGeoip2Module.register(configuration)
          : MaxmindGeoip2Module.registerAsync({
              imports: [ConfigurationModule],
              inject: ['CONFIGURATION'],
              useFactory: (config: MaxmindGeoip2Configuration) => config,
            });
      const module = await Test.createTestingModule({
        imports: [imported],
        providers: [
          {
            provide: 'CONSUMER',
            inject: [MaxmindGeoip2Service],
            useFactory: (service: MaxmindGeoip2Service) => service,
          },
        ],
      }).compile();

      try {
        expect(module.get('CONSUMER')).toBeInstanceOf(MaxmindGeoip2Service);
        expect(WebServiceClient).toHaveBeenCalledTimes(1);
        expect(WebServiceClient).toHaveBeenCalledWith(
          configuration.accountId,
          configuration.licenseKey,
          configuration.options,
        );
      } finally {
        await module.close();
      }
    },
  );
});
