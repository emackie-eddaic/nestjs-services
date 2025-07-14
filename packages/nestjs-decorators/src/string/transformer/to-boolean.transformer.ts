import { Transform } from 'class-transformer';

export function toBoolean(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  } else if (typeof value === 'boolean') {
    return value;
  } else if (typeof value === 'string') {
    return !['false', '0', ''].includes(value.trim());
  } else if (typeof value === 'number') {
    return value !== 0;
  } else if (typeof value === 'bigint') {
    return value !== 0n;
  } else if (typeof value === 'object') {
    return true;
  } else {
    return false;
  }
}

/**
 * Transform a boolean value or leave undefined if not present
 * @param field - the property name of the value to transform in the object
 * @returns PropertyDecorator
 */
export function ToBoolean(field: string) {
  return Transform(({ obj = {} }) =>
    typeof obj === 'object' && field in obj
      ? // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        toBoolean(obj[field])
      : undefined,
  );
}
