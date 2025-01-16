import { Injectable } from '@nestjs/common';
import CacheableLookup from 'cacheable-lookup';

@Injectable()
export class CacheableService {
  private readonly cacheable = new CacheableLookup();
  lookup() {
    return this.cacheable.lookup;
  }
}
