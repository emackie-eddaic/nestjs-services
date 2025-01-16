# nestjs-google-maps

Simple [NestJS](https://nestjs.com/) Module to support a [@maxmind/geoip2-node](https://github.com/maxmind/GeoIP2-node) client.

## Installation

```sh
npm install @eddaic/nestjs-maxmind-geoip2
```

## Usage

### Initializing

```typescript
import { MaxmindGeoip2Module } from '@eddaic/nestjs-maxmind-geoip2';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MaxmindGeoip2Module.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        accountId: config.get('MAXMIND_ACCOUNT_ID'),
        licenseKey: config.get('MAXMIND_LICENSE_KEY'),
      }),
    }),
  ],
  providers: [AppService],
})
export class AppModule {}
```

### Calling

```typescript
import { MaxmindGeoip2Service } from '@eddaic/nestjs-maxmind-geoip2';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor(private readonly geoip: MaxmindGeoip2Service) {}

  helloWorld() {
    const ip = '123.123.123.123';
    const result = this.geoip.client.city(ip);

    // Or use shorthand functions
    const result2 = this.geoip.city(ip);
  }
}
```
