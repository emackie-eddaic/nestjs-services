import { Transform } from 'class-transformer';
import { isNumber } from 'class-validator';
import { TransformIntOptions } from '../interface';
import { round } from '../util';
import { isBigInt } from '../validator';

export function transformBigInt(
  value: unknown,
  options?: TransformIntOptions,
): bigint | null {
  if (isBigInt(value)) {
    return BigInt(`${value}`);
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
