import { CacheableService } from '@eddaic/nestjs-cacheable';
import { HttpService } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThingsBoardHttpIntegrationModule } from './things-board-http-integration.module';
import { ThingsBoardHttpIntegrationService } from './things-board-http-integration.service';
import type { ThingsBoardHttpIntegrationConfiguration } from './type';

describe('ThingsBoardHttpIntegrationModule', () => {
  it.each(['sync', 'async'] as const)(
    'exports a working service with %s configuration and DNS lookup',
    async (registration) => {
      const configuration: ThingsBoardHttpIntegrationConfiguration = {
        baseUrl: 'https://thingsboard.example',
        integrationId: 'configured-id',
      };
      @Module({
        providers: [{ provide: 'CONFIGURATION', useValue: configuration }],
        exports: ['CONFIGURATION'],
      })
      class ConfigurationModule {}

      const imported =
        registration === 'sync'
          ? ThingsBoardHttpIntegrationModule.register(configuration)
          : ThingsBoardHttpIntegrationModule.registerAsync({
              imports: [ConfigurationModule],
              inject: ['CONFIGURATION'],
              useFactory: (config: ThingsBoardHttpIntegrationConfiguration) =>
                config,
            });
      const module = await Test.createTestingModule({
        imports: [imported],
        providers: [
          {
            provide: 'CONSUMER',
            inject: [ThingsBoardHttpIntegrationService],
            useFactory: (service: ThingsBoardHttpIntegrationService) => service,
          },
        ],
      }).compile();

      try {
        const service =
          module.get<ThingsBoardHttpIntegrationService>('CONSUMER');
        const http = module.get(HttpService);
        const cacheable = module.get(CacheableService);
        expect(http.axiosRef.defaults.lookup).toBe(cacheable.lookup());

        const body = {
          deviceName: 'sensor-1',
          deviceType: 'temperature',
          telemetry: { ts: 1234, values: { temperature: 21 } },
        };
        const received = jest.fn();
        http.axiosRef.defaults.adapter = (request) => {
          received(request.url, request.method, request.data);
          return Promise.resolve({
            data: undefined,
            status: 204,
            statusText: 'No Content',
            headers: {},
            config: request,
          });
        };

        await service.upload(body);

        expect(received).toHaveBeenCalledTimes(1);
        expect(received).toHaveBeenCalledWith(
          'https://thingsboard.example/api/v1/integrations/http/configured-id',
          'post',
          JSON.stringify(body),
        );
      } finally {
        await module.close();
      }
    },
  );
});
