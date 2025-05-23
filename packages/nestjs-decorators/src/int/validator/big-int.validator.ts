import {
  ValidateBy,
  ValidationOptions,
  buildMessage,
  isNumber,
  isNumberString,
  isString,
} from 'class-validator';
import { tryBigInt } from '../util';

/**
 * Checks if the value is a bigint or can be converted to a bigint.
 * @param value
 * @returns
 */
export function isBigInt(value: unknown): boolean {
  if (typeof value === 'bigint') {
    return true;
  } else if (isNumber(value, { maxDecimalPlaces: 0 })) {
    return true;
  } else if (isString(value) && isNumberString(value)) {
    return tryBigInt(`${value}`);
  } else {
    return false;
  }
}

/**
 * Checks if the value is a bigint or can be converted to a bigint.
 * @param options
 * @returns
 */
export function IsBigInt(options?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: 'isBigInt',
      constraints: [options],
      validator: {
        validate: isBigInt,
        defaultMessage: buildMessage(
          (_, args) => `${args?.property} property must be a BigInt`,
          options,
        ),
      },
    },
    options,
  );
}
