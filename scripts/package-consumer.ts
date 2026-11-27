// Copied into each installed tarball consumer as both .cts and .mts.
import 'reflect-metadata';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { CacheableModule, CacheableService } from '@eddaic/nestjs-cacheable';
import {
  IsBigInt,
  ParseBigIntPipe,
  TransformInt,
} from '@eddaic/nestjs-decorators';
import {
  type GoogleMapsConfiguration,
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
import { Client, Status } from '@googlemaps/google-maps-services-js';
import { PlacesClient, type protos } from '@googlemaps/places';
import {
  GooglePlacesModule,
  GooglePlacesService,
  type GooglePlacesConfiguration,
} from '@eddaic/nestjs-google-places';
import {
  FrankfurterModule,
  FrankfurterService,
  FrankfurterApiError,
  type FrankfurterConfiguration,
  type FrankfurterRatesOptions,
} from '@eddaic/nestjs-frankfurter-v2';
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
    let mapsCalls = 0;
    const mapsConfig: GoogleMapsConfiguration = {
      config: {
        experienceId: ['tarball-consumer'],
        config: {
          timeout: 1234,
          adapter: (request) => {
            mapsCalls++;
            assert.equal(
              request.url,
              'https://maps.googleapis.com/maps/api/geocode/json',
            );
            assert.equal(request.timeout, 1234);
            assert.equal(request.params.key, 'test-api-key');
            return Promise.resolve({
              data: { status: Status.OK, results: [] },
              status: 200,
              statusText: 'OK',
              headers: {},
              config: request,
            });
          },
        },
      },
    };
    const placesConfig: GooglePlacesConfiguration = {
      config: { apiKey: 'test-key', apiEndpoint: 'places.test.invalid' },
    };
    const geoipConfig = { accountId: '123', licenseKey: 'test-license' };
    const thingsboardConfig = {
      baseUrl: 'https://thingsboard.example',
      integrationId: 'test-id',
    };
    let placesClosed = false;
    const module = await Test.createTestingModule({
      imports: [
        CacheableModule,
        asyncRegistration
          ? GoogleMapsModule.registerAsync({
              useFactory: async () => mapsConfig,
            })
          : GoogleMapsModule.register(mapsConfig),
        asyncRegistration
          ? GooglePlacesModule.registerAsync({
              useFactory: async () => placesConfig,
            })
          : GooglePlacesModule.register(placesConfig),
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
      const maps = module.get(GoogleMapsService);
      assert.ok(maps.client instanceof Client);
      assert.deepEqual(
        Object.keys(require('@eddaic/nestjs-google-maps')).sort(),
        ['GoogleMapsModule', 'GoogleMapsService'],
      );
      const publicMapsExports: Record<
        keyof typeof import('@eddaic/nestjs-google-maps'),
        true
      > = {
        GoogleMapsModule: true,
        GoogleMapsService: true,
      };
      void publicMapsExports;
      assert.deepEqual(maps.client.getExperienceId(), ['tarball-consumer']);
      // The wrapper now exposes only the configured client; check the public
      // declaration surface as well as runtime absence of the removed members.
      const publicMapsApi: Record<keyof GoogleMapsService, true> = {
        client: true,
      };
      const publicMapsConfig: Record<keyof GoogleMapsConfiguration, true> = {
        config: true,
      };
      void publicMapsApi;
      void publicMapsConfig;
      for (const name of [
        'params',
        'elevation',
        'geolocate',
        'placeDetails',
        'reverseGeocode',
        'reverseGeocodeAsPlace',
        'timezone',
      ]) {
        assert.equal(name in maps, false);
      }
      const response = await maps.client.reverseGeocode({
        params: { key: 'test-api-key', latlng: { lat: 43, lng: -79 } },
      });
      assert.deepEqual(response.data.results, []);
      assert.equal(mapsCalls, 1);
      const places = module.get(GooglePlacesService);
      assert.ok(places.client instanceof PlacesClient);
      assert.equal(
        require('@eddaic/nestjs-google-places').GooglePlacesService,
        GooglePlacesService,
      );
      assert.equal(places.client.auth.apiKey, 'test-key');
      assert.deepEqual(
        Object.keys(require('@eddaic/nestjs-google-places')).sort(),
        ['GooglePlacesModule', 'GooglePlacesService'],
      );
      const placesApi: Record<keyof GooglePlacesService, true> = {
        client: true,
        onModuleDestroy: true,
      };
      void placesApi;
      const placeRequest: protos.google.maps.places.v1.IGetPlaceRequest = {
        name: 'places/test-place',
      };
      // Replace only the transport so the real client can be exercised offline.
      places.client.initialize = () => Promise.resolve({});
      places.client.innerApiCalls.getPlace = () =>
        Promise.resolve([{ id: 'test-place' }, placeRequest, {}]);
      const [place] = await places.client.getPlace(placeRequest, {
        otherArgs: { headers: { 'X-Goog-FieldMask': 'id' } },
      });
      assert.equal(place.id, 'test-place');
      const closePlaces = places.client.close.bind(places.client);
      places.client.close = () => {
        placesClosed = true;
        return closePlaces();
      };
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
    assert.equal(placesClosed, true);
    const frankfurterConfig: FrankfurterConfiguration = {
      baseUrl: 'https://frankfurter.test/v2',
      timeout: 1234,
    };
    const frankfurterModule = await Test.createTestingModule({
      imports: [
        asyncRegistration
          ? FrankfurterModule.registerAsync({
              useFactory: async () => frankfurterConfig,
            })
          : FrankfurterModule.register(frankfurterConfig),
      ],
    }).compile();
    try {
      assert.equal(
        require('@eddaic/nestjs-frankfurter-v2').FrankfurterService,
        FrankfurterService,
      );
      const service = frankfurterModule.get(FrankfurterService);
      const data = [
        { date: '2026-01-02', base: 'CAD', quote: 'USD', rate: 0.72 },
      ];
      frankfurterModule.get(HttpService).axiosRef.defaults.adapter = async (
        request,
      ) => {
        assert.equal(request.url, 'https://frankfurter.test/v2/rates');
        assert.equal(request.timeout, 1234);
        assert.equal(String(request.params), 'base=CAD&quotes=USD%2CEUR');
        return {
          data,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: request,
        };
      };
      const options: FrankfurterRatesOptions = {
        base: 'CAD',
        quotes: ['USD', 'EUR'],
      };
      assert.deepEqual(await service.getRates(options), data);
      assert.ok(new FrankfurterApiError(new Error('offline')) instanceof Error);
      // Check declaration constraints without sending an invalid request.
      const checkTypes = () => {
        // @ts-expect-error A historical date cannot be combined with a range.
        void service.getRates({ date: '2026-01-01', from: '2026-01-01' });
        // @ts-expect-error Provider routes select the provider through the path.
        void service.getProviderRates('ECB', { providers: ['BOC'] });
        // @ts-expect-error Only scope=all is supported.
        void service.getCurrencies({ scope: 'active' });
      };
      void checkTypes;
    } finally {
      await frankfurterModule.close();
    }
  }
}

void check().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
