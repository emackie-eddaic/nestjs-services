import { Transform } from 'class-transformer';
import { isArray } from 'class-validator';
import { TransformIntOptions } from '../interface';
import { round } from '../util';

export function transformInt(
  value: unknown,
  options?: TransformIntOptions,
): number | null {
  if (
    (typeof value !== 'number' && typeof value !== 'string') ||
    (typeof value === 'string' && value.trim() === '')
  ) {
    return null;
  }

  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    return null;
  }

  const result =
    options?.rounding !== undefined
      ? round(numberValue, options.rounding)
      : numberValue;
  return Number.isSafeInteger(result) ? result : null;
}

export function transformIntArray(
  values: Array<unknown>,
  options?: TransformIntOptions,
): Array<number | null> {
  return values.map((value) => transformInt(value, options));
}

/**
 * Transform a number or nonblank numeric string into a safe integer,
 * applying the specified rounding policy when provided.
 * Invalid, non-finite and unsafe results return null.
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
