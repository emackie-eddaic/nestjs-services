import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger';

export function ApiPropertyDate(
  options?: ApiPropertyOptions,
): PropertyDecorator {
  return ApiProperty({
    ...options,
    type: 'string',
    format: 'date-time',
    required: true,
  });
}

export function ApiPropertyDateOptional(
  options?: ApiPropertyOptions,
): PropertyDecorator {
  return ApiProperty({
    ...options,
    type: 'string',
    format: 'date-time',
    required: false,
  });
}
