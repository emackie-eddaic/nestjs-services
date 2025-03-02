import { Transform } from 'class-transformer';
import { isString } from 'class-validator';
import { SplitStringTransformOptions } from '../interface';

export function splitString(
  value: unknown,
  options: SplitStringTransformOptions = {},
): string[] | unknown {
  const { separator = ',', limit } = options;
  if (isString(value)) {
    return value.split(separator, limit);
  } else {
    return value;
  }
}

/**
 * Transforms a string by a delimiter which defaults to `,`. If the
 * passed value is not a string, the value is returned unchanged.
 * @returns
 */
export function SplitString(options?: SplitStringTransformOptions) {
  return Transform(({ value }) => splitString(value, options), options);
}
