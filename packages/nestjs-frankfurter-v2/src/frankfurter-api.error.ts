import { isAxiosError } from 'axios';

/** HTTP, timeout, cancellation, or transport failure from a Frankfurter request. */
export class FrankfurterApiError extends Error {
  readonly status?: number;
  readonly body: unknown;
  readonly code?: string;

  constructor(cause: unknown) {
    const error = isAxiosError<unknown>(cause) ? cause : undefined;
    const body: unknown = error?.response?.data;
    const upstreamMessage =
      typeof body === 'object' &&
      body !== null &&
      'message' in body &&
      typeof body.message === 'string'
        ? body.message
        : undefined;
    super(
      upstreamMessage ??
        (cause instanceof Error ? cause.message : 'Frankfurter request failed'),
      { cause },
    );
    this.name = 'FrankfurterApiError';
    this.status = error?.response?.status;
    this.body = body;
    this.code = error?.code;
  }
}
