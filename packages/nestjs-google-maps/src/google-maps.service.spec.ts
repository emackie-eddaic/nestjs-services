import { Test, TestingModule } from '@nestjs/testing';
import { GoogleMapsModule } from './google-maps.module';
import { MODULE_OPTIONS_TOKEN } from './google-maps.module-definition';
import { GoogleMapsService } from './google-maps.service';

describe('GoogleMapsService', () => {
  let service: GoogleMapsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [GoogleMapsModule],
      providers: [
        GoogleMapsService,
        { provide: MODULE_OPTIONS_TOKEN, useValue: {} },
      ],
    }).compile();

    service = module.get<GoogleMapsService>(GoogleMapsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('elevation', () => {
    it('should return GoogleMapService.elevation.data', async () => {
      const elevationSpy = jest
        .spyOn(service.client, 'elevation')
        .mockResolvedValue({ data: 'test' } as never);
      expect(
        await service.elevation({ locations: [{ latitude: 0, longitude: 0 }] }),
      ).toEqual('test');
      expect(elevationSpy).toHaveBeenCalled();
    });
  });

  describe('geolocate', () => {
    it('should return GoogleMapService.geolocate.data', async () => {
      const geolocateSpy = jest
        .spyOn(service.client, 'geolocate')
        .mockResolvedValue({ data: 'test' } as never);
      expect(await service.geolocate({})).toEqual('test');
      expect(geolocateSpy).toHaveBeenCalled();
    });
  });

  describe('placeDetails', () => {
    it('should return GoogleMapService.placeDetails.data.result', async () => {
      const placeDetailsSpy = jest
        .spyOn(service.client, 'placeDetails')
        .mockResolvedValue({ data: { result: 'test' } } as never);
      expect(await service.placeDetails({ place_id: 'test' })).toEqual('test');
      expect(placeDetailsSpy).toHaveBeenCalled();
    });
  });

  describe('reverseGeocode', () => {
    it('should return GoogleMapService.reverseGeocode.data.results', async () => {
      const spy = jest
        .spyOn(service.client, 'reverseGeocode')
        .mockResolvedValue({ data: { results: [] } } as never);
      expect(await service.reverseGeocode({ place_id: 'test' })).toEqual([]);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('reverseGeocodeAsPlace', () => {
    it('should return GoogleMapService.placeDetails from result', async () => {
      const reverseGeocodeSpy = jest
        .spyOn(service, 'reverseGeocode')
        .mockResolvedValue(['test'] as never);
      const placeDetailsSpy = jest
        .spyOn(service, 'placeDetails')
        .mockResolvedValue('test' as never);
      expect(await service.reverseGeocodeAsPlace({})).toEqual('test');
      expect(reverseGeocodeSpy).toHaveBeenCalled();
      expect(placeDetailsSpy).toHaveBeenCalled();
    });

    it('should throw error if no results', async () => {
      const reverseGeocodeSpy = jest
        .spyOn(service, 'reverseGeocode')
        .mockResolvedValue({ results: [] } as never);
      await expect(service.reverseGeocodeAsPlace({})).rejects.toThrow(Error);
      expect(reverseGeocodeSpy).toHaveBeenCalled();
    });
  });

  describe('timezone', () => {
    it('should return GoogleMapService.client.timezone.data', async () => {
      const spy = jest
        .spyOn(service.client, 'timezone')
        .mockResolvedValue({ data: 'test' } as never);
      expect(
        await service.timezone({
          location: { lat: 0, lng: 0 },
          timestamp: new Date(),
        }),
      ).toEqual('test');
      expect(spy).toHaveBeenCalled();
    });
  });
});
