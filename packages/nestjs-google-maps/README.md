# nestjs-google-maps

Simple [NestJS](https://nestjs.com/) Module to support a [google-maps-services-js](https://github.com/googlemaps/google-maps-services-js) client.

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

  async lookup(place_id: string, points: { lat: number; lng: number }[]) {
    // Some convenience methods are included
    const placeDetails = await this.maps.placeDetails({ place_id });

    // Otherwise can access the client directly for full set of APIs
    const params = { ...this.maps.params, points };
    const response = await this.maps.client.nearestRoads({ params });
    return { placeDetails, roads: response.data };
  }
}
```
