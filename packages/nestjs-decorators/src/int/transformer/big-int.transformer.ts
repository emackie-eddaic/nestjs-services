import { Transform } from 'class-transformer';
import { isNumber } from 'class-validator';
import { TransformIntOptions } from '../interface';
import { round } from '../util';
import { isBigInt } from '../validator';

export function transformBigInt(
  value: unknown,
  options?: TransformIntOptions,
): bigint | null {
  if (typeof value === 'bigint') {
    return value;
  }
  if (isBigInt(value)) {
    if (typeof value === 'bigint') {
      return value;
    } else if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return BigInt(value);
    } else {
      return null;
    }
  } else if (options?.rounding !== undefined && isNumber(value)) {
    return BigInt(round(value, options.rounding));
  } else {
    return null;
  }
}

/**
 * Transform value into bigint using specified options. If the value
 * converted into bigint, null is returned.
 *
 * Otherwise a the value will be returned rounded as necessary
 * using the specified rounding policy.
 * @param options {@link TransformIntOptions}
 * @returns
 */
export function TransformBigInt(options?: TransformIntOptions) {
  return Transform(({ value }) => transformBigInt(value, options), options);
}
