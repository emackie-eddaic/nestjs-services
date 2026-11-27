import { HttpService } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  FrankfurterModule,
  FrankfurterService,
  type FrankfurterConfiguration,
} from './index';

describe('FrankfurterModule', () => {
  it.each(['default', 'sync', 'async'] as const)(
    'exports an injectable service with %s configuration',
    async (registration) => {
      const config: FrankfurterConfiguration = {
        baseUrl: 'https://local.test/v2',
        timeout: 1234,
        headers: { Authorization: 'Bearer test' },
      };
      @Module({
        providers: [{ provide: 'CONFIG', useValue: config }],
        exports: ['CONFIG'],
      })
      class ConfigurationModule {}
      const imported =
        registration === 'default'
          ? FrankfurterModule
          : registration === 'sync'
            ? FrankfurterModule.register(config)
            : FrankfurterModule.registerAsync({
                imports: [ConfigurationModule],
                inject: ['CONFIG'],
                useFactory: (value: FrankfurterConfiguration) =>
                  Promise.resolve(value),
              });
      const module = await Test.createTestingModule({
        imports: [imported],
        providers: [
          {
            provide: 'CONSUMER',
            inject: [FrankfurterService],
            useFactory: (service: FrankfurterService) => service,
          },
        ],
      }).compile();
      try {
        const received = jest.fn();
        module.get(HttpService).axiosRef.defaults.adapter = (request) => {
          received(
            request.url,
            request.timeout,
            request.headers.get('Authorization'),
          );
          return Promise.resolve({
            data: [],
            status: 200,
            statusText: 'OK',
            headers: {},
            config: request,
          });
        };
        await expect(
          module.get<FrankfurterService>('CONSUMER').getRates(),
        ).resolves.toEqual([]);
        expect(received).toHaveBeenCalledWith(
          registration === 'default'
            ? 'https://api.frankfurter.dev/v2/rates'
            : 'https://local.test/v2/rates',
          registration === 'default' ? 10000 : 1234,
          registration === 'default' ? undefined : 'Bearer test',
        );
      } finally {
        await module.close();
      }
    },
  );
});
