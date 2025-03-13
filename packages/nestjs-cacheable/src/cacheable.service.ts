import { Injectable } from '@nestjs/common';
import CacheableLookup from 'cacheable-lookup';

@Injectable()
export class CacheableService {
  public readonly cacheable = new CacheableLookup();
}
