import { Test } from '@nestjs/testing';
import { Client, Status } from './index';
import { GoogleMapsModule } from './google-maps.module';
import { GoogleMapsService } from './google-maps.service';

describe('GoogleMapsService', () => {
  it.each([GoogleMapsModule, GoogleMapsModule.register({})])(
    'provides a default client without shared authentication configuration (%#)',
    async (imported) => {
      const module = await Test.createTestingModule({
        imports: [imported],
      }).compile();
      try {
        const service = module.get(GoogleMapsService);
        expect(service.client).toBeInstanceOf(Client);
        expect('params' in service).toBe(false);
        for (const name of [
          'elevation',
          'geolocate',
          'placeDetails',
          'reverseGeocode',
          'reverseGeocodeAsPlace',
          'timezone',
        ]) {
          expect(name in service).toBe(false);
        }
      } finally {
        await module.close();
      }
    },
  );

  it('forwards client options and uses credentials from each direct request', async () => {
    const requests: { key: string; latlng: unknown }[] = [];
    const module = await Test.createTestingModule({
      imports: [
        GoogleMapsModule.register({
          config: {
            experienceId: ['consumer'],
            config: {
              timeout: 1234,
              headers: { 'X-Test': 'configured' },
              adapter: (request) => {
                expect(request.url).toBe(
                  'https://maps.googleapis.com/maps/api/geocode/json',
                );
                expect(request.timeout).toBe(1234);
                expect(request.headers.get('X-Test')).toBe('configured');
                expect(request.headers.get('X-GOOG-MAPS-EXPERIENCE-ID')).toBe(
                  'consumer',
                );
                requests.push(
                  request.params as { key: string; latlng: unknown },
                );
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
        }),
      ],
    }).compile();
    try {
      const service = module.get(GoogleMapsService);
      const latlng = { lat: 43, lng: -79 };
      for (const key of ['first-key', 'second-key']) {
        const response = await service.client.reverseGeocode({
          params: { key, latlng },
        });
        expect(response.data).toEqual({ status: Status.OK, results: [] });
      }
      expect(requests).toEqual([
        { key: 'first-key', latlng },
        { key: 'second-key', latlng },
      ]);
    } finally {
      await module.close();
    }
  });

  it('preserves direct-client error propagation', async () => {
    const failure = new Error('HTTP adapter failed');
    const module = await Test.createTestingModule({
      imports: [
        GoogleMapsModule.register({
          config: { config: { adapter: () => Promise.reject(failure) } },
        }),
      ],
    }).compile();
    try {
      await expect(
        module.get(GoogleMapsService).client.reverseGeocode({
          params: { key: 'test-key', latlng: { lat: 43, lng: -79 } },
        }),
      ).rejects.toBe(failure);
    } finally {
      await module.close();
    }
  });
});
