import { ApiPropertyOptions } from '@nestjs/swagger';
import { createApiPropertyDecorator } from '@nestjs/swagger/dist/decorators/api-property.decorator';

export function ApiPropertyDate(
  options?: ApiPropertyOptions,
): PropertyDecorator {
  return createApiPropertyDecorator({
    ...options,
    type: 'string',
    format: 'date-time',
    required: true,
  });
}

export function ApiPropertyDateOptional(
  options?: ApiPropertyOptions,
): PropertyDecorator {
  return createApiPropertyDecorator({
    ...options,
    type: 'string',
    format: 'date-time',
    required: false,
  });
}
