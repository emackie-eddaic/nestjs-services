import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { isEmpty, isObject, isString } from 'class-validator';

export function getIpFromRequest(request: unknown): string | undefined {
  if (request !== undefined && request !== null && isObject(request)) {
    if (
      'headers' in request &&
      request.headers !== undefined &&
      request.headers !== null &&
      isObject(request.headers) &&
      'x-forwarded-for' in request.headers &&
      isString(request.headers['x-forwarded-for']) &&
      !isEmpty(request.headers['x-forwarded-for'])
    ) {
      // Sanitize forwarded for IPs that can contain proxy IPs as well as client,
      // * in form `49.43.35.84, 34.110.181.101`.
      return request.headers['x-forwarded-for'].split(',')[0].trim();
    } else if (
      'ip' in request &&
      isString(request.ip) &&
      !isEmpty(request.ip)
    ) {
      return request.ip.trim();
    } else {
      return undefined;
    }
  } else {
    return undefined;
  }
}

export const GetIp = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string | undefined =>
    getIpFromRequest(context.switchToHttp().getRequest()),
);
