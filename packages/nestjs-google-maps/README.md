# nestjs-google-maps

A [NestJS](https://nestjs.com/) dependency-injection wrapper for the official [Google Maps Services JS](https://github.com/googlemaps/google-maps-services-js) client. `GoogleMapsService.client` exposes the underlying client directly. The public exports are `GoogleMapsModule`, `GoogleMapsService`, and the wrapper configuration type `GoogleMapsConfiguration`.

## Compatibility

Supports NestJS 11 and 12 in CommonJS and ESM applications. Published JavaScript is CommonJS with TypeScript declarations; ESM applications can use named imports. NestJS 12 requires Node.js 20.19+ (22.12+ on Node 22); Node.js 24 is recommended.

## Installation

```sh
npm install @eddaic/nestjs-google-maps @nestjs/config
```

If your application imports Google client classes, types, or enums, declare the official client as a direct dependency as well:

```sh
npm install @googlemaps/google-maps-services-js@^3.4.2
```

Import those symbols from `@googlemaps/google-maps-services-js`, for example:

```typescript
import {
  Status,
  type ReverseGeocodeRequest,
} from '@googlemaps/google-maps-services-js';
```

The wrapper continues to depend on the official client for its implementation. Applications that only access `maps.client` do not need a separate client import.

## Usage

### Initializing

Register `GoogleMapsModule` without configuration to use the client's defaults:

```typescript
import { GoogleMapsModule } from '@eddaic/nestjs-google-maps';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), GoogleMapsModule],
})
export class AppModule {}
```

Use `GoogleMapsModule.register({ config: clientOptions })` to configure the official client synchronously. For asynchronous configuration, use `registerAsync`:

```typescript
GoogleMapsModule.registerAsync({
  useFactory: () => ({
    config: {
      config: { timeout: 5000 },
    },
  }),
});
```

`GoogleMapsConfiguration.config` is the official client's `ClientOptions`: it accepts an Axios `config`, a custom `axiosInstance`, and experience IDs. The nested `config.config` in the example is intentional. Credentials belong in individual requests; module configuration does not set a shared API key.

### Calling

Provide your consuming service in a module that imports `GoogleMapsModule`. The following example uses the globally registered `ConfigService` to obtain a key for each request:

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
    const roads = await this.maps.client.nearestRoads({
      params: { key, points },
    });
    return { addresses: data.results, roads: roads.data };
  }
}
```

Direct calls retain the official client's request, response, and error behavior. They return a response envelope; read `response.data` for the API payload. For geolocation, set `considerIp: false` unless looking up the server's location.

## Migrating from 6.x

The previously deprecated convenience helpers and shared authentication parameters have been removed in this major release:

| Removed API                             | Migration path                                                                                                                                                          |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `service.elevation(params)`             | Call `service.client.elevation({ params: { key, ...params } })` and read `response.data`.                                                                               |
| `service.geolocate(data)`               | Call `service.client.geolocate({ params: { key }, data })` and read `response.data`.                                                                                    |
| `service.reverseGeocode(params)`        | Call `service.client.reverseGeocode({ params: { key, ...params } })` and read `response.data.results`.                                                                  |
| `service.timezone(params)`              | Call `service.client.timezone({ params: { key, ...params } })` and read `response.data`.                                                                                |
| `service.placeDetails(params)`          | Use the official Places API (New) client; a separate NestJS wrapper is planned.                                                                                         |
| `service.reverseGeocodeAsPlace(params)` | Reverse geocode through `service.client`, then retrieve details with the official Places API (New) client. Handle empty geocoding results in the consuming application. |
| `service.params`                        | Obtain authentication parameters from your application configuration and supply them in each request.                                                                   |
| `GoogleMapsConfiguration.params`        | Remove this option from `register` / `registerAsync` configuration. Use `{}` or the bare module for defaults. Existing `config` client options retain their shape.      |

Upstream client re-exports and the helper-only aliases `GeolocateRequestData`, `PlaceDetailsRequestParams`, `ReverseGeocodeParams`, and `TimezoneParams` have also been removed. Import upstream classes, enums, and request/response types from `@googlemaps/google-maps-services-js` directly and declare that package as a direct application dependency. For example, use `GeolocateRequest['data']` or `PlaceDetailsRequest['params']` from the official package rather than the old helper aliases; direct request parameters include authentication.

The official Google Maps Services JS implementation dependency is retained. No replacement dependency is introduced. Existing projects requiring legacy Places can still call the underlying `client.placeDetails` directly; applications that require the removed helpers must remain on the previous major until migrated.

## Legacy Places limitations

The underlying client's Places methods still call Places API (Legacy), which cannot be enabled for new Google Cloud projects. Enabling Places API (New) does not authorize these legacy calls. Removing the NestJS helpers does not change the upstream client's endpoints.

For new Places integrations, use Google's official [`@googlemaps/places`](https://developers.google.com/maps/documentation/places/web-service/client-libraries) client. A separate NestJS wrapper is planned and is not yet published. Enable **Places API (New)** and allow it in API-key restrictions before migrating. See [Google's migration guide](https://developers.google.com/maps/documentation/places/web-service/legacy/migrate-overview).
