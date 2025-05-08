import { ApiPropertyOptions } from '@nestjs/swagger';
import { createApiPropertyDecorator } from '@nestjs/swagger/dist/decorators/api-property.decorator';

export function ApiPropertyUri(
  options?: ApiPropertyOptions,
): PropertyDecorator {
  return createApiPropertyDecorator({
    type: 'string',
    format: 'uri',
    ...options,
  });
}

export function ApiPropertyUriOptional(
  options?: ApiPropertyOptions,
): PropertyDecorator {
  return createApiPropertyDecorator({
    ...options,
    format: 'uri',
    required: false,
    type: 'string',
  });
}
