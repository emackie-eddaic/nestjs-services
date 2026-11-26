# nestjs-google-maps

A [NestJS](https://nestjs.com/) module for configuring a [Google Maps Services JS](https://github.com/googlemaps/google-maps-services-js) client through dependency injection. It includes convenience methods for place details, reverse geocoding, geolocation, elevation, and time zones, with direct access to the underlying client.

## Compatibility

Supports NestJS 11 and 12 in CommonJS and ESM applications. Published JavaScript is CommonJS with TypeScript declarations; ESM applications can use named imports. NestJS 12 requires Node.js 20.19+ (22.12+ on Node 22); Node.js 24 is recommended.

## Deprecated convenience helpers and shared parameters

All six `GoogleMapsService` convenience helpers are deprecated and will be
removed in the next major release. The shared `GoogleMapsService.params` property
and `GoogleMapsConfiguration.params` option are also deprecated for removal with
the helpers. The configured `client` remains available for direct calls to the
official Google client.

| Helper                  | Migration path                                                                                        |
| ----------------------- | ----------------------------------------------------------------------------------------------------- |
| `elevation`             | Call `client.elevation` and read `response.data`.                                                     |
| `geolocate`             | Call `client.geolocate` with `params` and the observation `data`, then read `response.data`.          |
| `reverseGeocode`        | Call `client.reverseGeocode` and read `response.data.results`.                                        |
| `timezone`              | Call `client.timezone` and read `response.data`.                                                      |
| `placeDetails`          | Migrate to the planned Places API (New) wrapper described below.                                      |
| `reverseGeocodeAsPlace` | Call `client.reverseGeocode`, then retrieve place details using the planned Places API (New) wrapper. |

Supply authentication parameters from your application's configuration in each
direct-client request, as shown in the usage example. The deprecated module
configuration option `params` remains required until the next major release for
compatibility with the existing helpers; it does not set default credentials on
`client`. For geolocation, set `considerIp: false` unless looking up the server's
location.

The two Places helpers use Places API (Legacy), which cannot be enabled for new
Google Cloud projects. Their replacement will be a separate NestJS wrapper
library for Google's official
[`@googlemaps/places`](https://developers.google.com/maps/documentation/places/web-service/client-libraries)
client. That wrapper is planned and is not yet published. Migrating to it will
require enabling **Places API (New)** and allowing it in API-key restrictions;
enabling the new API does not make the current legacy helpers work. See
[Google's migration guide](https://developers.google.com/maps/documentation/places/web-service/legacy/migrate-overview).

The helper deprecations do not change runtime behavior, dependencies, or Google
configuration. They do not deprecate the underlying Elevation, Geolocation,
Geocoding, or Time Zone APIs. This package continues wrapping
`@googlemaps/google-maps-services-js`, including its existing direct-client and
re-exported APIs. Existing projects with legacy Places access can continue using
the Places helpers until removal.

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
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(
    private readonly maps: GoogleMapsService,
    private readonly config: ConfigService,
  ) {}

  async lookup(
    lat: number,
    lng: number,
    points: { lat: number; lng: number }[],
  ) {
    const key = this.config.getOrThrow<string>('GOOGLE_API_KEY');
    const { data } = await this.maps.client.reverseGeocode({
      params: { key, latlng: { lat, lng } },
    });
    const addresses = data.results;

    // Use the configured client directly for the full set of APIs
    const params = { key, points };
    const response = await this.maps.client.nearestRoads({ params });
    return { addresses, roads: response.data };
  }
}
```
