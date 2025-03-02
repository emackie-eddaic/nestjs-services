import { Transform, TransformOptions } from 'class-transformer';
import { isString } from 'class-validator';

export function toLower(value: unknown): string | null {
  if (isString(value)) {
    return value.toLowerCase();
  } else {
    return null;
  }
}

/**
 * Removes the leading and trailing white space and line terminator characters from string input.
 *
 * Null is returned if the value is not a string.
 * @returns
 */
export function ToLower(options?: TransformOptions) {
  return Transform(({ value }) => toLower(value), options);
}
