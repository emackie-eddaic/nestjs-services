# nestjs-thingsboard-http-integration

Simple [NestJS](https://nestjs.com/) Module to make Thingsboard HTTP Integration upload calls.

## Installation

```sh
npm install @eddaic/nestjs-thingsboard-http-integration
```

## Usage

### Initializing

```typescript
import { ThingsBoardHttpIntegrationModule } from '@eddaic/nnestjs-thingsboard-http-integration';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ThingsBoardHttpIntegrationModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        baseUrl: config.get('THINGSBOARD_URL'), // Not required. Defaults to 'https://thingsboard.cloud'
        integrationId: config.get('THINGSBOARD_INTEGRATION_ID'), // Can get from the thingsboard integrations dashboard
      }),
    }),
  ],
  providers: [AppService],
})
export class AppModule {}
```
