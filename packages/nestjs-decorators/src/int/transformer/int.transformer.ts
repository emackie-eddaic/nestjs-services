import { Transform } from 'class-transformer';
import { isArray, isEmpty, isInt } from 'class-validator';
import { TransformIntOptions } from '../interface';
import { round } from '../util';

export function transformInt(
  value: unknown,
  options?: TransformIntOptions,
): number | null {
  if (!isEmpty(value)) {
    const numberValue = Number(value);
    if (isInt(numberValue)) {
      return numberValue;
    } else if (options?.rounding !== undefined) {
      return round(numberValue, options.rounding);
    }
  }
  return null;
}

export function transformIntArray(
  values: Array<unknown>,
  options?: TransformIntOptions,
): Array<number | null> {
  return values.map(value => transformInt(value, options));
}

/**
 * Transform value into integer using specified options. If the value
 * is null, empty or undefined, it will return null.
 *
 * Otherwise an integer value will be returned rounded as necessary
 * using the specified rounding policy.
 * @param options {@link TransformIntOptions}
 * @returns
 */
export function TransformInt(options: TransformIntOptions = {}) {
  const { each = false, ...rest } = options;
  return Transform(
    ({ value }) =>
      each && isArray(value)
        ? transformIntArray(value, rest)
        : transformInt(value, rest),
    rest,
  );
}
