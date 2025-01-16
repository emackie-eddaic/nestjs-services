import { Module } from '@nestjs/common';
import { CacheableService } from './cacheable.service';

@Module({
  exports: [CacheableService],
  providers: [CacheableService],
})
export class CacheableModule {}
