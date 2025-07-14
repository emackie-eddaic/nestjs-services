import { Transform, TransformOptions } from 'class-transformer';

/**
 * Returns `null` value for `null` string (case insensitive),
 * or the value otherwise
 * @param value
 * @returns
 */
export function toNull(value: unknown) {
  if (value === null) {
    return null;
  } else if (typeof value === 'string') {
    return value.toLowerCase() === 'null' ? null : value;
  } else {
    return value;
  }
}

/**
 * Returns `null` value for `null` string (case insensitive),
 * or the value otherwise
 * @returns
 */
export function ToNull(options?: TransformOptions) {
  return Transform(({ value }) => toNull(value), options);
}
