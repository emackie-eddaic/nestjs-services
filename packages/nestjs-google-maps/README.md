# nestjs-google-maps

A NestJS wrapper for the official [Google Maps Services JS](https://github.com/googlemaps/google-maps-services-js) client. Exports `GoogleMapsModule`, `GoogleMapsService`, and the `GoogleMapsConfiguration` type.

Supports NestJS 11 and 12 in CommonJS and ESM applications. Use Node.js 20.19+ (22.12+ on Node 22).

## Installation

Install the wrapper and its required Google client peer:

```sh
npm install @eddaic/nestjs-google-maps @googlemaps/google-maps-services-js
```

Import Google types and enums directly from `@googlemaps/google-maps-services-js`.

## Usage

```typescript
import { GoogleMapsModule } from '@eddaic/nestjs-google-maps';
import { Module } from '@nestjs/common';
import { AppService } from './app.service';

@Module({
  imports: [GoogleMapsModule],
  providers: [AppService],
})
export class AppModule {}
```

Call the configured client with credentials in each request:

```typescript
import { GoogleMapsService } from '@eddaic/nestjs-google-maps';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor(private readonly maps: GoogleMapsService) {}

  async addresses(key: string, lat: number, lng: number) {
    const { data } = await this.maps.client.reverseGeocode({
      params: { key, latlng: { lat, lng } },
    });
    return data.results;
  }
}
```

To customize the client, replace the bare module import with:

```typescript
GoogleMapsModule.register({
  config: {
    config: { timeout: 5000 },
  },
});
```

The outer `config` accepts the official `ClientOptions`, including Axios `config`, `axiosInstance`, and `experienceId`. Use `registerAsync` for configuration supplied through Nest dependency injection.

## Places API support

The underlying client uses Places API (Legacy), which cannot be enabled for new Google Cloud projects. For Places API (New), use the separate [nestjs-google-places](../nestjs-google-places/README.md) wrapper.
