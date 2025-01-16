import { Test, TestingModule } from '@nestjs/testing';
import { MODULE_OPTIONS_TOKEN } from './maxmind-geoip2.module-definition';
import { MaxmindGeoip2Service } from './maxmind-geoip2.service';

describe('MaxmindGeoip2Service', () => {
  let service: MaxmindGeoip2Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaxmindGeoip2Service,
        { provide: MODULE_OPTIONS_TOKEN, useValue: {} },
      ],
    }).compile();

    service = module.get<MaxmindGeoip2Service>(MaxmindGeoip2Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('city', () => {
    it('should return GoogleMapService.reverseGeocode.data.results', async () => {
      const spy = jest
        .spyOn(service.client, 'city')
        .mockResolvedValue('test' as never);
      expect(await service.city('test')).toEqual('test');
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('country', () => {
    it('should return GoogleMapService.reverseGeocode.data.results', async () => {
      const spy = jest
        .spyOn(service.client, 'country')
        .mockResolvedValue('test' as never);
      expect(await service.country('test')).toEqual('test');
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('insights', () => {
    it('should return GoogleMapService.reverseGeocode.data.results', async () => {
      const spy = jest
        .spyOn(service.client, 'insights')
        .mockResolvedValue('test' as never);
      expect(await service.insights('test')).toEqual('test');
      expect(spy).toHaveBeenCalled();
    });
  });
});
