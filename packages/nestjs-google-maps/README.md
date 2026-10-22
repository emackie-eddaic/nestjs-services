# nestjs-google-maps

A [NestJS](https://nestjs.com/) module for configuring a [Google Maps Services JS](https://github.com/googlemaps/google-maps-services-js) client through dependency injection. It includes convenience methods for place details, reverse geocoding, geolocation, elevation, and time zones, with direct access to the underlying client.

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
