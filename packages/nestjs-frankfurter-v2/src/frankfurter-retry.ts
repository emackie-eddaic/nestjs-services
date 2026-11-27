import type { HttpService } from '@nestjs/axios';
import type { InternalAxiosRequestConfig } from 'axios' with {
  'resolution-mode': 'import',
};
import { AxiosError, CanceledError, isAxiosError, isCancel } from 'axios';
import type { FrankfurterRetryOptions } from './type';

type RetryState = {
  started: number;
  count: number;
  timeout: number;
  // A closure survives Axios config merging without embedding a circular error.config.
  lastFailure?: () => unknown;
};
type RetryConfig = InternalAxiosRequestConfig & {
  _frankfurterRetry?: RetryState;
};
const networkCodes = new Set([
  'ERR_NETWORK',
  'ECONNRESET',
  'ECONNREFUSED',
  'EAI_AGAIN',
  'ENOTFOUND',
  'EPIPE',
]);
const timeoutCodes = new Set(['ECONNABORTED', 'ETIMEDOUT']);
const maximum = 2147483647;

function duration(value: number, name: string, allowZero = false): number {
  if (
    !Number.isInteger(value) ||
    value < (allowZero ? 0 : 1) ||
    value > maximum
  ) {
    throw new TypeError(
      `Frankfurter retry.${name} must be an integer from ${allowZero ? 0 : 1} through ${maximum}`,
    );
  }
  return value;
}

function retryAfter(value: unknown): number {
  if (typeof value !== 'string' && typeof value !== 'number') return 0;
  const text = String(value).trim();
  if (/^\d+(?:\.\d+)?$/.test(text)) return Number(text) * 1000;
  const date = Date.parse(text);
  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : 0;
}

function wait(delay: number, config: RetryConfig): Promise<void> {
  return new Promise((resolve, reject) => {
    const signal = config.signal;
    const abort = () => {
      clearTimeout(timer);
      signal?.removeEventListener?.('abort', abort);
      reject(new CanceledError('Frankfurter retry canceled', config));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener?.('abort', abort);
      resolve();
    }, delay);
    signal?.addEventListener?.('abort', abort, { once: true });
    if (signal?.aborted) abort();
  });
}

/** Installs retries on one Axios instance, before service-level error wrapping/validation. */
export function installRetries(
  client: HttpService['axiosRef'],
  options: FrankfurterRetryOptions = {},
  timeout: number,
): () => void {
  const retries = duration(options.retries ?? 0, 'retries', true);
  const delay = duration(options.delay ?? 100, 'delay', true);
  const maxDelay = duration(options.maxDelay ?? 30000, 'maxDelay', true);
  const totalTimeout = duration(
    options.totalTimeout ?? timeout,
    'totalTimeout',
  );
  const statuses = options.statusCodes ?? [429, 500, 502, 503, 504];
  if (
    maxDelay < delay ||
    statuses.some(
      (status) => !Number.isInteger(status) || status < 400 || status > 599,
    )
  ) {
    throw new TypeError(
      'Frankfurter retry requires maxDelay >= delay and statusCodes between 400 and 599',
    );
  }
  if (retries === 0) return () => {};
  const requestId = client.interceptors.request.use((request: RetryConfig) => {
    const state: RetryState = (request._frankfurterRetry ??= {
      started: Date.now(),
      count: 0,
      timeout: request.timeout ?? timeout,
    });
    const remaining = totalTimeout - (Date.now() - state.started);
    if (remaining <= 0) {
      if (state.lastFailure) throw state.lastFailure();
      throw new AxiosError(
        'Frankfurter retry time budget exhausted',
        'ETIMEDOUT',
        request,
      );
    }
    request.timeout = Math.min(state.timeout || totalTimeout, remaining);
    return request;
  });
  const responseId = client.interceptors.response.use(
    undefined,
    async (error: unknown) => {
      if (!isAxiosError(error) || isCancel(error)) throw error;
      const config: RetryConfig | undefined = error.config;
      const state = config?._frankfurterRetry;
      if (
        !config ||
        !state ||
        config.method?.toLowerCase() !== 'get' ||
        config.signal?.aborted ||
        state.count >= retries
      )
        throw error;
      const retriable = error.response
        ? statuses.includes(error.response.status)
        : networkCodes.has(error.code ?? '') ||
          (options.retryTimeouts === true &&
            timeoutCodes.has(error.code ?? ''));
      if (!retriable) throw error;
      const serverDelay = retryAfter(
        Object.entries(error.response?.headers ?? {}).find(
          ([name]) => name.toLowerCase() === 'retry-after',
        )?.[1],
      );
      const backoff = Math.floor(
        Math.random() *
          Math.min(maxDelay, delay * 2 ** Math.min(state.count, 31)),
      );
      const pause = Math.max(serverDelay, backoff);
      // Never retry earlier than Retry-After or outside the configured budget.
      if (
        pause > maxDelay ||
        pause >= totalTimeout - (Date.now() - state.started)
      )
        throw error;
      state.lastFailure = () => error;
      state.count++;
      await wait(pause, config);
      if (Date.now() - state.started >= totalTimeout) throw error;
      return client.request<unknown>(config);
    },
  );
  return () => {
    client.interceptors.request.eject(requestId);
    client.interceptors.response.eject(responseId);
  };
}
