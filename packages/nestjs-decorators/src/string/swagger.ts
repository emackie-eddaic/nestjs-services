import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger';

export function ApiPropertyUri(
  options?: ApiPropertyOptions,
): PropertyDecorator {
  return ApiProperty({
    type: 'string',
    format: 'uri',
    ...options,
  });
}

export function ApiPropertyUriOptional(
  options?: ApiPropertyOptions,
): PropertyDecorator {
  return ApiProperty({
    ...options,
    format: 'uri',
    required: false,
    type: 'string',
  });
}
