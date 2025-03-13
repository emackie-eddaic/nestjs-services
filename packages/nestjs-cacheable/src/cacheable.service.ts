import { Injectable } from '@nestjs/common';
import CacheableLookup from 'cacheable-lookup';

@Injectable()
export class CacheableService {
  public readonly cacheable = new CacheableLookup();
  lookup() {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    return this.cacheable.lookup;
  }
}
