import { Test, type TestingModule } from '@nestjs/testing';
import { PlacesClient, type protos } from '@googlemaps/places';
import * as api from './index';
import { GooglePlacesModule } from './google-places.module';
import { GooglePlacesService } from './google-places.service';

describe('GooglePlacesService', () => {
  it('exports only the NestJS module and service at runtime', () => {
    expect(Object.keys(api).sort()).toEqual([
      'GooglePlacesModule',
      'GooglePlacesService',
    ]);
  });

  it.each([GooglePlacesModule, GooglePlacesModule.register({})])(
    'supports default configuration without eager authentication (%#)',
    async (imported) => {
      const module = await Test.createTestingModule({
        imports: [imported],
      }).compile();
      try {
        const service = module.get(GooglePlacesService);
        expect(service.client).toBeInstanceOf(PlacesClient);
        expect(service.client.apiEndpoint).toBe('places.googleapis.com');
        expect(service.client.placesStub).toBeUndefined();
      } finally {
        await module.close();
      }
    },
  );

  describe('configured client', () => {
    let module: TestingModule;
    let service: GooglePlacesService;

    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [
          GooglePlacesModule.register({ config: { apiKey: 'test-key' } }),
        ],
      }).compile();
      service = module.get(GooglePlacesService);
      // Replace only authentication/transport setup. Public getPlace still runs
      // through the real official client, without credentials or network calls.
      jest.spyOn(service.client, 'initialize').mockResolvedValue({});
    });

    afterEach(async () => {
      await module.close();
    });

    it('exposes official requests, field masks, and response tuples unchanged', async () => {
      const request: protos.google.maps.places.v1.IGetPlaceRequest = {
        name: 'places/test-place',
      };
      const place: protos.google.maps.places.v1.IPlace = {
        id: 'test-place',
        formattedAddress: 'Test address',
      };
      const getPlace = jest.fn().mockResolvedValue([place, request, {}]);
      service.client.innerApiCalls.getPlace = getPlace;
      const result = await service.client.getPlace(request, {
        otherArgs: { headers: { 'X-Goog-FieldMask': 'id,formattedAddress' } },
      });
      expect(result[0]).toBe(place);
      expect(result[1]).toBe(request);
      expect(getPlace).toHaveBeenCalledWith(
        request,
        expect.objectContaining({
          otherArgs: {
            headers: {
              'X-Goog-FieldMask': 'id,formattedAddress',
              'x-goog-request-params': 'name=places%2Ftest-place',
            },
          },
        }),
        undefined,
      );
    });

    it('propagates upstream API errors', async () => {
      const failure = new Error('Places request denied');
      service.client.innerApiCalls.getPlace = jest
        .fn()
        .mockRejectedValue(failure);
      await expect(
        service.client.getPlace({ name: 'places/test-place' }),
      ).rejects.toBe(failure);
    });

    it('awaits client shutdown when the Nest module closes', async () => {
      let finish!: () => void;
      let started!: () => void;
      const pending = new Promise<void>((resolve) => {
        finish = resolve;
      });
      const start = new Promise<void>((resolve) => {
        started = resolve;
      });
      const close = jest
        .spyOn(service.client, 'close')
        .mockImplementation(() => {
          started();
          return pending;
        });
      let closed = false;
      const closing = module.close().then(() => {
        closed = true;
      });
      await start;
      expect(closed).toBe(false);
      finish();
      await closing;
      expect(close).toHaveBeenCalledTimes(1);
      close.mockResolvedValue();
    });
  });
});
