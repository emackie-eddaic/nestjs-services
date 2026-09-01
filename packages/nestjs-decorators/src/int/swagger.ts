import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger';

export function ApiPropertyInt(
  options?: Omit<ApiPropertyOptions, 'type' | 'format'>,
): PropertyDecorator {
  return ApiProperty({
    ...options,
    type: 'integer',
    format: 'int',
    required: true,
  });
}

export function ApiPropertyIntOptional(
  options?: Omit<ApiPropertyOptions, 'type' | 'format' | 'required'>,
): PropertyDecorator {
  return ApiProperty({
    ...options,
    type: 'integer',
    format: 'int',
    required: false,
  });
}

export function ApiPropertyBigInt(
  options?: Omit<ApiPropertyOptions, 'type' | 'format'>,
): PropertyDecorator {
  return ApiProperty({
    ...options,
    type: 'integer',
    format: 'int64',
    required: true,
  });
}

export function ApiPropertyBigIntOptional(
  options?: Omit<ApiPropertyOptions, 'type' | 'format' | 'required'>,
): PropertyDecorator {
  return ApiProperty({
    ...options,
    type: 'integer',
    format: 'int64',
    required: false,
  });
}
