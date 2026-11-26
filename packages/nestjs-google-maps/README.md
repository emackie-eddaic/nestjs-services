# nestjs-google-maps

A [NestJS](https://nestjs.com/) module for configuring a [Google Maps Services JS](https://github.com/googlemaps/google-maps-services-js) client through dependency injection. It includes convenience methods for place details, reverse geocoding, geolocation, elevation, and time zones, with direct access to the underlying client.

## Compatibility

Supports NestJS 11 and 12 in CommonJS and ESM applications. Published JavaScript is CommonJS with TypeScript declarations; ESM applications can use named imports. NestJS 12 requires Node.js 20.19+ (22.12+ on Node 22); Node.js 24 is recommended.

## Deprecated legacy Places helpers

`GoogleMapsService.placeDetails` and `GoogleMapsService.reverseGeocodeAsPlace`
are deprecated and will be removed in the next major release. They use Places
API (Legacy), which cannot be enabled for new Google Cloud projects. Existing
projects with legacy access can continue using these helpers until removal;
this deprecation does not change runtime behavior or Google configuration.

The replacement will be a separate NestJS wrapper library for Google's official
[`@googlemaps/places`](https://developers.google.com/maps/documentation/places/web-service/client-libraries)
client. That wrapper is planned and is not yet published. Migrating to it will
require enabling **Places API (New)** and allowing it in API-key restrictions;
enabling the new API does not make the current legacy helpers work. See
[Google's migration guide](https://developers.google.com/maps/documentation/places/web-service/legacy/migrate-overview).

For address lookups, continue using `reverseGeocode`. Elevation, geolocation,
time-zone helpers, and direct access to the existing official client remain
available. This package continues wrapping `@googlemaps/google-maps-services-js`.

## Installation

```sh
npm install @eddaic/nestjs-google-maps @nestjs/config
```

## Usage

### Initializing

```typescript
import { GoogleMapsModule } from '@eddaic/nestjs-google-maps';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    GoogleMapsModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        params: { key: config.getOrThrow<string>('GOOGLE_API_KEY') },
      }),
    }),
  ],
})
export class AppModule {}
```

### Calling

Register this service in your application's `providers`.

```typescript
import { GoogleMapsService } from '@eddaic/nestjs-google-maps';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor(private readonly maps: GoogleMapsService) {}

  async lookup(
    lat: number,
    lng: number,
    points: { lat: number; lng: number }[],
  ) {
    // Look up addresses without calling the deprecated legacy Places helpers
    const addresses = await this.maps.reverseGeocode({ latlng: { lat, lng } });

    // Otherwise can access the client directly for full set of APIs
    const params = { ...this.maps.params, points };
    const response = await this.maps.client.nearestRoads({ params });
    return { addresses, roads: response.data };
  }
}
```
