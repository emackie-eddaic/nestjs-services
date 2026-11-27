# nestjs-google-places

A NestJS wrapper for Google's official [`@googlemaps/places`](https://developers.google.com/maps/documentation/places/web-service/client-library-examples) client. Exports `GooglePlacesModule`, `GooglePlacesService`, and the `GooglePlacesConfiguration` type.

Supports NestJS 11 and 12 in CommonJS and ESM applications on Node.js 22.12+.

## Installation

```sh
npm install @eddaic/nestjs-google-places @googlemaps/places @nestjs/config
```

The Google client is a required 3.x peer dependency. Import its types directly from `@googlemaps/places`.

## Configuration

Enable **Places API (New)** and allow it in your API key's restrictions. Legacy Places enablement does not authorize this API.

```typescript
import { GooglePlacesModule } from '@eddaic/nestjs-google-places';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    GooglePlacesModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        config: { apiKey: config.getOrThrow<string>('GOOGLE_API_KEY') },
      }),
    }),
  ],
  providers: [AppService],
})
export class AppModule {}
```

`register({ config: clientOptions })` accepts the same options synchronously. A bare `GooglePlacesModule` import uses the official client's defaults, including Application Default Credentials. The client is closed automatically when Nest destroys the module.

## Usage

```typescript
import { GooglePlacesService } from '@eddaic/nestjs-google-places';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor(private readonly places: GooglePlacesService) {}

  async details(placeId: string) {
    const [place] = await this.places.client.getPlace(
      { name: `places/${placeId}` },
      {
        otherArgs: {
          headers: { 'X-Goog-FieldMask': 'id,formattedAddress,location' },
        },
      },
    );
    return place;
  }
}
```

Use the official client directly for details, search, autocomplete, and photos. Requests, response tuples, and errors retain their upstream behavior. Select only needed fields: [field masks](https://developers.google.com/maps/documentation/places/web-service/choose-fields) are required for details and searches and affect billing.
