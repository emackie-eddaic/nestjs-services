# nestjs-cacheable

A [NestJS](https://nestjs.com/) module for DNS caching with [cacheable-lookup](https://github.com/szmarczak/cacheable-lookup#readme). It provides an injectable service exposing a cached DNS lookup function for HTTP clients.

## Compatibility

Supports NestJS 11 and 12 in CommonJS and ESM applications. Published JavaScript is CommonJS with TypeScript declarations; ESM applications can use named imports. NestJS 12 requires Node.js 20.19+ (22.12+ on Node 22); Node.js 24 is recommended.

## Installation

```sh
npm install @eddaic/nestjs-cacheable @nestjs/axios @nestjs/config
```

## Usage

```typescript
import { CacheableModule, CacheableService } from '@eddaic/nestjs-cacheable';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HttpModule.registerAsync({
      imports: [CacheableModule],
      inject: [CacheableService, ConfigService],
      useFactory: (cacheable: CacheableService, config: ConfigService) => ({
        baseURL: config.get<string>('MY_URL'),
        lookup: cacheable.lookup(),
      }),
    }),
  ],
})
export class AppModule {}
```
