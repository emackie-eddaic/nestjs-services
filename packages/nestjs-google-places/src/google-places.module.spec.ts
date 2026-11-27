import { Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PlacesClient } from '@googlemaps/places';
import { GooglePlacesModule } from './google-places.module';
import { GooglePlacesService } from './google-places.service';
import type { GooglePlacesConfiguration } from './type';

describe('GooglePlacesModule', () => {
  it.each(['sync', 'async'] as const)(
    'exports a configured Places client with %s registration',
    async (registration) => {
      const configuration: GooglePlacesConfiguration = {
        config: { apiKey: 'test-key', apiEndpoint: 'places.test.invalid' },
      };
      @Module({
        providers: [{ provide: 'CONFIGURATION', useValue: configuration }],
        exports: ['CONFIGURATION'],
      })
      class ConfigurationModule {}

      const imported =
        registration === 'sync'
          ? GooglePlacesModule.register(configuration)
          : GooglePlacesModule.registerAsync({
              imports: [ConfigurationModule],
              inject: ['CONFIGURATION'],
              useFactory: (config: GooglePlacesConfiguration) =>
                Promise.resolve(config),
            });
      const module = await Test.createTestingModule({
        imports: [imported],
        providers: [
          {
            provide: 'CONSUMER',
            inject: [GooglePlacesService],
            useFactory: (service: GooglePlacesService) => service,
          },
        ],
      }).compile();
      try {
        const service = module.get<GooglePlacesService>('CONSUMER');
        expect(service.client).toBeInstanceOf(PlacesClient);
        expect(service.client.auth.apiKey).toBe('test-key');
      } finally {
        await module.close();
      }
    },
  );
});
