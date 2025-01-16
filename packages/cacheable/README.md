# nestjs-cacheable

Simple [NestJS](https://nestjs.com/) Module to add DNS cache using [szmarczak/cacheable-lookup](https://github.com/szmarczak/cacheable-lookup#readme).

## Installation

```sh
npm install @eddaic/nestjs-cacheable
```

## Usage

```typescript
import { CacheableModule, CacheableService } from '@eddaic/nestjs-cacheable';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [CacheableModule, ConfigModule],
      inject: [CacheableService, ConfigService],
      useFactory: (cacheable: CacheableService, config: ConfigService) => ({
        baseURL: config.get('MY_URL'),
        lookup: cacheable.lookup(),
      }),
    }),
  ],
  providers: [AppService],
})
export class AppModule {}
```
