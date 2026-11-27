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
  it('isolates Axios hooks and transport defaults between configured modules', async () => {
    const instances: HttpService['axiosRef'][] = [];
    const configured = (name: string) =>
      FrankfurterModule.register({
        retry: { retries: name === 'first' ? 1 : 0 },
        configureAxios: (client) => {
          instances.push(client);
          client.defaults.headers.common['X-Module'] = name;
          client.defaults.adapter = (request) =>
            Promise.resolve({
              data: [
                {
                  date: '2026-01-02',
                  base: 'EUR',
                  quote: 'USD',
                  rate: name === 'first' ? 1 : 2,
                },
              ],
              status: 200,
              statusText: 'OK',
              headers: {},
              config: request,
            });
        },
      });
    const first = configured('first');
    const second = configured('second');
    const module = await Test.createTestingModule({
      imports: [first, second],
    }).compile();
    try {
      const one = module
        .select(first)
        .get(FrankfurterService, { strict: true });
      const two = module
        .select(second)
        .get(FrankfurterService, { strict: true });
      expect((await one.getRates())[0].rate).toBe(1);
      expect((await two.getRates())[0].rate).toBe(2);
      expect(instances).toHaveLength(2);
      expect(instances[0]).not.toBe(instances[1]);
      expect(
        instances
          .map((client) => client.defaults.headers.common['X-Module'])
          .sort(),
      ).toEqual(['first', 'second']);
    } finally {
      await module.close();
    }
  });
});
