import { Transform, TransformOptions } from 'class-transformer';

export interface SplitStringTransformOptions extends TransformOptions {
  /**
   * A string that identifies character or characters to use in separating the string. If omitted, a single-element array containing the entire string is returned.
   * @default ,
   */
  separator?: string | RegExp;
  /**
   * A value used to limit the number of elements returned in the array.
   */
  limit?: number;
}

export function splitString(
  value: unknown,
  options: SplitStringTransformOptions = {},
): unknown {
  const { separator = ',', limit } = options;
  if (typeof value === 'string') {
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
