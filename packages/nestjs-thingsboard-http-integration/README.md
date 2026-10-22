# nestjs-thingsboard-http-integration

A [NestJS](https://nestjs.com/) module for uploading IoT telemetry through ThingsBoard HTTP integrations. It provides an injectable upload service with cached DNS lookups and supports ThingsBoard Cloud or a configured ThingsBoard base URL.

## Compatibility

Supports NestJS 11 and 12 in CommonJS and ESM applications. Published JavaScript is CommonJS with TypeScript declarations; ESM applications can use named imports. NestJS 12 requires Node.js 20.19+ (22.12+ on Node 22); Node.js 24 is recommended.

Use `@nestjs/axios` 4 with NestJS 11, or `@nestjs/axios` 12 with NestJS 11 or 12.

## Installation

```sh
npm install @eddaic/nestjs-thingsboard-http-integration @nestjs/axios @nestjs/config
```

## Usage

### Initializing

```typescript
import { ThingsBoardHttpIntegrationModule } from '@eddaic/nestjs-thingsboard-http-integration';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThingsBoardHttpIntegrationModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        baseUrl: config.get<string>('THINGSBOARD_URL'), // Not required. Defaults to 'https://thingsboard.cloud'
        integrationId: config.getOrThrow<string>('THINGSBOARD_INTEGRATION_ID'), // Can get from the thingsboard integrations dashboard
      }),
    }),
  ],
})
export class AppModule {}
```
