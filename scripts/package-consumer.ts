// Copied into each installed tarball consumer as both .cts and .mts.
import 'reflect-metadata';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { CacheableModule, CacheableService } from '@eddaic/nestjs-cacheable';
import { IsBigInt, ParseBigIntPipe, TransformInt } from '@eddaic/nestjs-decorators';
import {
  GoogleMapsModule,
  GoogleMapsService,
} from '@eddaic/nestjs-google-maps';
import {
  MaxmindGeoip2Module,
  MaxmindGeoip2Service,
} from '@eddaic/nestjs-maxmind-geoip2';
import {
  ThingsBoardHttpIntegrationModule,
  ThingsBoardHttpIntegrationService,
} from '@eddaic/nestjs-thingsboard-http-integration';
import { HttpService } from '@nestjs/axios';
import { Test } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

class Dto {
  @TransformInt()
  value!: number;

  @IsBigInt()
  id!: bigint;
}

async function check() {
  // Importing and requiring the same package must preserve Nest injection tokens.
  const require = createRequire(`${process.cwd()}/consumer.cjs`);
  assert.equal(
    require('@eddaic/nestjs-cacheable').CacheableService,
    CacheableService,
  );
  assert.equal(plainToInstance(Dto, { value: '42' }).value, 42);
  assert.deepEqual(validateSync(plainToInstance(Dto, { id: 42n })), []);
  const errors = validateSync(plainToInstance(Dto, { id: 'invalid' }));
  assert.equal(errors.length, 1);
  assert.equal(errors[0].property, 'id');
  assert.equal(errors[0].constraints?.isBigInt, 'id property must be a BigInt');
  assert.equal(
    await new ParseBigIntPipe().transform('9007199254740993', {
      type: 'param',
    }),
    9007199254740993n,
  );

  for (const asyncRegistration of [false, true]) {
    const mapsConfig = { params: { key: 'test-api-key' } };
    const geoipConfig = { accountId: '123', licenseKey: 'test-license' };
    const thingsboardConfig = {
      baseUrl: 'https://thingsboard.example',
      integrationId: 'test-id',
    };
    const module = await Test.createTestingModule({
      imports: [
        CacheableModule,
        asyncRegistration
          ? GoogleMapsModule.registerAsync({
              useFactory: async () => mapsConfig,
            })
          : GoogleMapsModule.register(mapsConfig),
        asyncRegistration
          ? MaxmindGeoip2Module.registerAsync({
              useFactory: async () => geoipConfig,
            })
          : MaxmindGeoip2Module.register(geoipConfig),
        asyncRegistration
          ? ThingsBoardHttpIntegrationModule.registerAsync({
              useFactory: async () => thingsboardConfig,
            })
          : ThingsBoardHttpIntegrationModule.register(thingsboardConfig),
      ],
    }).compile();
    try {
      await module.init();
      assert.ok(module.get(CacheableService) instanceof CacheableService);
      assert.deepEqual(module.get(GoogleMapsService).params, mapsConfig.params);
      assert.ok(
        module.get(MaxmindGeoip2Service) instanceof MaxmindGeoip2Service,
      );
      const http = module.get(HttpService);
      assert.equal(typeof http.axiosRef.defaults.lookup, 'function');
      let calls = 0;
      http.axiosRef.defaults.adapter = async (request) => {
        calls++;
        assert.equal(
          request.url,
          'https://thingsboard.example/api/v1/integrations/http/test-id',
        );
        assert.equal(request.method, 'post');
        return {
          data: undefined,
          status: 204,
          statusText: 'No Content',
          headers: {},
          config: request,
        };
      };
      await module.get(ThingsBoardHttpIntegrationService).upload({
        deviceName: 'sensor',
        deviceType: 'test',
        telemetry: { ts: 1, values: { value: 42 } },
      });
      assert.equal(calls, 1);
    } finally {
      await module.close();
    }
  }
}

void check().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
