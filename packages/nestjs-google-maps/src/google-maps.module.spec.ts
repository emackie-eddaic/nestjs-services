import { Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { GoogleMapsModule } from './google-maps.module';
import { GoogleMapsService } from './google-maps.service';
import type { GoogleMapsConfiguration } from './type';

describe('GoogleMapsModule', () => {
  it.each(['sync', 'async'] as const)(
    'exports the service with %s configuration',
    async (registration) => {
      const configuration: GoogleMapsConfiguration = {
        config: { experienceId: ['test-experience'] },
      };
      @Module({
        providers: [{ provide: 'CONFIGURATION', useValue: configuration }],
        exports: ['CONFIGURATION'],
      })
      class ConfigurationModule {}

      const imported =
        registration === 'sync'
          ? GoogleMapsModule.register(configuration)
          : GoogleMapsModule.registerAsync({
              imports: [ConfigurationModule],
              inject: ['CONFIGURATION'],
              useFactory: (config: GoogleMapsConfiguration) => config,
            });
      const module = await Test.createTestingModule({
        imports: [imported],
        providers: [
          {
            provide: 'CONSUMER',
            inject: [GoogleMapsService],
            useFactory: (service: GoogleMapsService) => service,
          },
        ],
      }).compile();

      try {
        const service = module.get<GoogleMapsService>('CONSUMER');
        expect(service).toBeInstanceOf(GoogleMapsService);
        expect(service.client.getExperienceId()).toEqual(['test-experience']);
      } finally {
        await module.close();
      }
    },
  );
});
