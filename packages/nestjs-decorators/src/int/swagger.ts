import {
  ApiPropertyOptions,
  createApiPropertyDecorator,
} from '@nestjs/swagger/dist/decorators/api-property.decorator';

export function ApiPropertyInt(
  options?: Omit<ApiPropertyOptions, 'type' | 'format'>,
): PropertyDecorator {
  return createApiPropertyDecorator({
    ...options,
    type: 'integer',
    format: 'int',
    required: true,
  });
}

export function ApiPropertyIntOptional(
  options?: Omit<ApiPropertyOptions, 'type' | 'format' | 'required'>,
): PropertyDecorator {
  return createApiPropertyDecorator({
    ...options,
    type: 'integer',
    format: 'int',
    required: false,
  });
}

export function ApiPropertyBigInt(
  options?: Omit<ApiPropertyOptions, 'type' | 'format'>,
): PropertyDecorator {
  return createApiPropertyDecorator({
    ...options,
    type: 'integer',
    format: 'int64',
    required: true,
  });
}

export function ApiPropertyBigIntOptional(
  options?: Omit<ApiPropertyOptions, 'type' | 'format' | 'required'>,
): PropertyDecorator {
  return createApiPropertyDecorator({
    ...options,
    type: 'integer',
    format: 'int64',
    required: false,
  });
}
