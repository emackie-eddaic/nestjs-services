# nestjs-maxmind-geoip2

Simple [NestJS](https://nestjs.com/) Module to support a [@maxmind/geoip2-node](https://github.com/maxmind/GeoIP2-node) client.

## Installation

```sh
npm install @eddaic/nestjs-maxmind-geoip2 @nestjs/config
```

## Usage

### Initializing

```typescript
import { MaxmindGeoip2Module } from '@eddaic/nestjs-maxmind-geoip2';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MaxmindGeoip2Module.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        accountId: config.getOrThrow<string>('MAXMIND_ACCOUNT_ID'),
        licenseKey: config.getOrThrow<string>('MAXMIND_LICENSE_KEY'),
      }),
    }),
  ],
})
export class AppModule {}
```

### Calling

Register this service in your application's `providers`.

```typescript
import { MaxmindGeoip2Service } from '@eddaic/nestjs-maxmind-geoip2';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor(private readonly geoip: MaxmindGeoip2Service) {}

  city(ip: string) {
    return this.geoip.city(ip);
  }

  // The underlying client also exposes the complete API.
  country(ip: string) {
    return this.geoip.client.country(ip);
  }
}
```
