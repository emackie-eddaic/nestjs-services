import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { transformBigInt } from '../transformer';

@Injectable()
export class ParseBigIntPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): bigint {
    const bigIntValue = transformBigInt(value);
    if (bigIntValue === null) {
      throw new BadRequestException(`${metadata.data} must be a valid bigint`);
    } else {
      return bigIntValue;
    }
  }
}
