import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios' with {
  'resolution-mode': 'import',
};
import { FrankfurterService } from './frankfurter.service';
import { FrankfurterApiError } from './frankfurter-api.error';
import type { FrankfurterConfiguration } from './type';

const rate = { date: '2026-01-02', base: 'EUR', quote: 'USD', rate: 1.1 };
function response(config: InternalAxiosRequestConfig) {
  return { data: rate, status: 200, statusText: 'OK', headers: {}, config };
}
function failure(
  config: InternalAxiosRequestConfig,
  status?: number,
  headers = {},
  code = 'ERR_BAD_RESPONSE',
) {
  return new AxiosError(
    'upstream failure',
    code,
    config,
    undefined,
    status === undefined
      ? undefined
      : {
          data: { message: 'upstream failure' },
          status,
          statusText: 'Error',
          headers,
          config,
        },
  );
}
function setup(config: FrankfurterConfiguration, adapter: AxiosAdapter) {
  const client = new HttpService().axiosRef.create({ adapter });
  return {
    service: new FrankfurterService(config, new HttpService(client)),
    client,
  };
}

describe('Frankfurter Axios retries', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('does not retry by default', async () => {
    const adapter = jest.fn((config: InternalAxiosRequestConfig) =>
      Promise.reject(failure(config, 503)),
    );
    const { service } = setup({}, adapter);
    await expect(service.getRate('EUR', 'USD')).rejects.toMatchObject({
      status: 503,
    });
    expect(adapter).toHaveBeenCalledTimes(1);
  });

  it('uses bounded exponential backoff with jitter and retains the terminal failure', async () => {
    const adapter = jest.fn((config: InternalAxiosRequestConfig) =>
      Promise.reject(failure(config, 503)),
    );
    const { service } = setup(
      { retry: { retries: 2, delay: 100, maxDelay: 150 } },
      adapter,
    );
    const pending = service
      .getRate('EUR', 'USD')
      .catch((error: unknown) => error);
    await jest.advanceTimersByTimeAsync(49);
    expect(adapter).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(1);
    expect(adapter).toHaveBeenCalledTimes(2);
    await jest.advanceTimersByTimeAsync(74);
    expect(adapter).toHaveBeenCalledTimes(2);
    await jest.advanceTimersByTimeAsync(1);
    expect(adapter).toHaveBeenCalledTimes(3);
    expect(await pending).toBeInstanceOf(FrankfurterApiError);
    expect(await pending).toMatchObject({
      status: 503,
      message: 'upstream failure',
    });
  });

  it.each(['seconds', 'date'] as const)(
    'respects Retry-After in %s form',
    async (form) => {
      jest.setSystemTime(new Date('2026-01-01T00:00:00Z'));
      let attempts = 0;
      const header =
        form === 'seconds' ? '1' : new Date(Date.now() + 1000).toUTCString();
      const adapter = jest.fn((config: InternalAxiosRequestConfig) =>
        ++attempts === 1
          ? Promise.reject(failure(config, 429, { 'retry-after': header }))
          : Promise.resolve(response(config)),
      );
      const { service } = setup({ retry: { retries: 1 } }, adapter);
      const pending = service.getRate('EUR', 'USD');
      await jest.advanceTimersByTimeAsync(999);
      expect(adapter).toHaveBeenCalledTimes(1);
      await jest.advanceTimersByTimeAsync(1);
      await expect(pending).resolves.toEqual(rate);
      expect(adapter).toHaveBeenCalledTimes(2);
    },
  );

  it.each(['unparseable', '-1'])(
    'ignores invalid Retry-After %s and uses backoff',
    async (header) => {
      let attempts = 0;
      const adapter = jest.fn((config: InternalAxiosRequestConfig) =>
        ++attempts === 1
          ? Promise.reject(failure(config, 503, { 'retry-after': header }))
          : Promise.resolve(response(config)),
      );
      const { service } = setup({ retry: { retries: 1 } }, adapter);
      const pending = service.getRate('EUR', 'USD');
      await jest.advanceTimersByTimeAsync(50);
      await expect(pending).resolves.toEqual(rate);
      expect(adapter).toHaveBeenCalledTimes(2);
    },
  );

  it.each([
    { maxDelay: 500, totalTimeout: 10000 },
    { maxDelay: 30000, totalTimeout: 500 },
  ])(
    'stops if Retry-After exceeds the delay cap or remaining budget: %j',
    async (limits) => {
      const adapter = jest.fn((config: InternalAxiosRequestConfig) =>
        Promise.reject(failure(config, 429, { 'retry-after': '1' })),
      );
      const { service } = setup({ retry: { retries: 2, ...limits } }, adapter);
      await expect(service.getRate('EUR', 'USD')).rejects.toMatchObject({
        status: 429,
      });
      expect(adapter).toHaveBeenCalledTimes(1);
    },
  );

  it('subtracts attempt duration and backoff from the next attempt timeout', async () => {
    const timeouts: (number | undefined)[] = [];
    const adapter: AxiosAdapter = (config) => {
      timeouts.push(config.timeout);
      if (timeouts.length > 1) return Promise.resolve(response(config));
      return new Promise((_resolve, reject) => {
        setTimeout(() => reject(failure(config, 503)), 800);
      });
    };
    const { service } = setup(
      { timeout: 1000, retry: { retries: 1, delay: 200 } },
      adapter,
    );
    const pending = service.getRate('EUR', 'USD');
    await jest.advanceTimersByTimeAsync(900);
    await expect(pending).resolves.toEqual(rate);
    expect(timeouts).toEqual([1000, 100]);
  });

  it('does not dispatch when an async request hook exhausts the total budget', async () => {
    const adapter = jest.fn((config: InternalAxiosRequestConfig) =>
      Promise.resolve(response(config)),
    );
    const { service } = setup(
      {
        retry: { retries: 1, totalTimeout: 60 },
        configureAxios: (client) => {
          client.interceptors.request.use(async (config) => {
            await new Promise<void>((resolve) => setTimeout(resolve, 100));
            return config;
          });
        },
      },
      adapter,
    );
    const pending = service
      .getRate('EUR', 'USD')
      .catch((error: unknown) => error);
    await jest.advanceTimersByTimeAsync(100);
    expect(await pending).toMatchObject({
      code: 'ETIMEDOUT',
      status: undefined,
    });
    expect(adapter).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
  });

  it('subtracts async request hook time from the transport timeout', async () => {
    const adapter = jest.fn((config: InternalAxiosRequestConfig) =>
      Promise.resolve(response(config)),
    );
    const { service } = setup(
      {
        timeout: 100,
        retry: { retries: 1, totalTimeout: 60 },
        configureAxios: (client) => {
          client.interceptors.request.use(async (config) => {
            await new Promise<void>((resolve) => setTimeout(resolve, 20));
            return config;
          });
        },
      },
      adapter,
    );
    const pending = service.getRate('EUR', 'USD');
    await jest.advanceTimersByTimeAsync(20);
    await expect(pending).resolves.toEqual(rate);
    expect(adapter).toHaveBeenCalledTimes(1);
    expect(adapter.mock.calls[0][0].timeout).toBe(40);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('preserves custom serializers across retries and counts their execution time', async () => {
    const serialize = jest.fn((data: unknown) => {
      jest.setSystemTime(Date.now() + 10);
      return data;
    });
    const timeouts: (number | undefined)[] = [];
    const adapter = jest.fn((config: InternalAxiosRequestConfig) => {
      timeouts.push(config.timeout);
      return timeouts.length === 1
        ? Promise.reject(failure(config, 503))
        : Promise.resolve(response(config));
    });
    const { service } = setup(
      {
        retry: { retries: 1, delay: 20, totalTimeout: 60 },
        configureAxios: (client) => {
          client.defaults.transformRequest = serialize;
          client.interceptors.request.use(async (config) => {
            await new Promise<void>((resolve) => setTimeout(resolve, 10));
            return config;
          });
        },
      },
      adapter,
    );
    const pending = service.getRate('EUR', 'USD');
    await jest.runAllTimersAsync();
    await expect(pending).resolves.toEqual(rate);
    expect(timeouts).toEqual([40, 10]);
    expect(serialize).toHaveBeenCalledTimes(2);
  });

  it('preserves the terminal failure when an async retry hook exhausts the budget', async () => {
    let original: unknown;
    let hooks = 0;
    const adapter = jest.fn((config: InternalAxiosRequestConfig) => {
      const cause = failure(config, 503);
      original = cause;
      return Promise.reject(cause);
    });
    const { service } = setup(
      {
        retry: { retries: 2, delay: 0, totalTimeout: 60 },
        configureAxios: (client) => {
          client.interceptors.request.use(async (config) => {
            if (++hooks === 2)
              await new Promise<void>((resolve) => setTimeout(resolve, 100));
            return config;
          });
        },
      },
      adapter,
    );
    const pending = service
      .getRate('EUR', 'USD')
      .catch((error: unknown) => error);
    await jest.advanceTimersByTimeAsync(100);
    const error: unknown = await pending;
    expect(error).toMatchObject({
      status: 503,
      body: { message: 'upstream failure' },
    });
    expect(error instanceof FrankfurterApiError ? error.cause : undefined).toBe(
      original,
    );
    expect(adapter).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('preserves the last HTTP failure when a backoff timer resumes after the budget', async () => {
    let original: unknown;
    const adapter = jest.fn((config: InternalAxiosRequestConfig) => {
      const cause = failure(config, 503);
      original = cause;
      return Promise.reject(cause);
    });
    const { service } = setup(
      { retry: { retries: 2, delay: 100, totalTimeout: 100 } },
      adapter,
    );
    const pending = service
      .getRate('EUR', 'USD')
      .catch((error: unknown) => error);
    await jest.advanceTimersByTimeAsync(0);
    // Simulate the event loop being unable to run the 50ms backoff timer in time.
    jest.setSystemTime(Date.now() + 200);
    await jest.advanceTimersByTimeAsync(50);
    const error: unknown = await pending;
    expect(error).toMatchObject({
      status: 503,
      body: { message: 'upstream failure' },
    });
    expect(error instanceof FrankfurterApiError ? error.cause : undefined).toBe(
      original,
    );
    expect(adapter).toHaveBeenCalledTimes(1);
  });

  it('preserves the last HTTP failure when the budget expires before redispatch', async () => {
    let original: unknown;
    const adapter = jest.fn((config: InternalAxiosRequestConfig) => {
      const cause = failure(config, 503);
      original = cause;
      return Promise.reject(cause);
    });
    const { service, client } = setup(
      { retry: { retries: 2, delay: 0, totalTimeout: 100 } },
      adapter,
    );
    let dispatches = 0;
    client.interceptors.request.use((config) => {
      if (++dispatches === 2) jest.setSystemTime(Date.now() + 200);
      return config;
    });
    const pending = service
      .getRate('EUR', 'USD')
      .catch((error: unknown) => error);
    await jest.advanceTimersByTimeAsync(0);
    const error: unknown = await pending;
    expect(error).toMatchObject({
      status: 503,
      body: { message: 'upstream failure' },
    });
    expect(error instanceof FrankfurterApiError ? error.cause : undefined).toBe(
      original,
    );
    expect(adapter).toHaveBeenCalledTimes(1);
  });

  it.each([400, 401, 403, 404, 422, 501])(
    'does not retry HTTP %s by default',
    async (status) => {
      const adapter = jest.fn((config: InternalAxiosRequestConfig) =>
        Promise.reject(failure(config, status)),
      );
      const { service } = setup({ retry: { retries: 3 } }, adapter);
      await expect(service.getRate('EUR', 'USD')).rejects.toMatchObject({
        status,
      });
      expect(adapter).toHaveBeenCalledTimes(1);
    },
  );

  it('supports an explicit status allowlist', async () => {
    let count = 0;
    const adapter = jest.fn((config: InternalAxiosRequestConfig) =>
      ++count === 1
        ? Promise.reject(failure(config, 408))
        : Promise.resolve(response(config)),
    );
    const { service } = setup(
      { retry: { retries: 1, delay: 0, statusCodes: [408] } },
      adapter,
    );
    const pending = service.getRate('EUR', 'USD');
    await jest.advanceTimersByTimeAsync(0);
    await expect(pending).resolves.toEqual(rate);
  });

  it.each(['ECONNRESET', 'EAI_AGAIN', 'ERR_NETWORK'])(
    'retries network failure %s',
    async (code) => {
      let count = 0;
      const adapter = jest.fn((config: InternalAxiosRequestConfig) =>
        ++count === 1
          ? Promise.reject(failure(config, undefined, {}, code))
          : Promise.resolve(response(config)),
      );
      const { service } = setup({ retry: { retries: 1, delay: 0 } }, adapter);
      const pending = service.getRate('EUR', 'USD');
      await jest.advanceTimersByTimeAsync(0);
      await expect(pending).resolves.toEqual(rate);
      expect(adapter).toHaveBeenCalledTimes(2);
    },
  );

  it.each([false, true])(
    'retries timeouts only when retryTimeouts=%s',
    async (retryTimeouts) => {
      const adapter = jest.fn((config: InternalAxiosRequestConfig) =>
        Promise.reject(failure(config, undefined, {}, 'ECONNABORTED')),
      );
      const { service } = setup(
        { retry: { retries: 1, delay: 0, retryTimeouts } },
        adapter,
      );
      const pending = service
        .getRate('EUR', 'USD')
        .catch((error: unknown) => error);
      await jest.advanceTimersByTimeAsync(0);
      expect(await pending).toMatchObject({ code: 'ECONNABORTED' });
      expect(adapter).toHaveBeenCalledTimes(retryTimeouts ? 2 : 1);
    },
  );

  it('cancels backoff immediately and clears the pending timer', async () => {
    const adapter = jest.fn((config: InternalAxiosRequestConfig) =>
      Promise.reject(failure(config, 503)),
    );
    const { service } = setup({ retry: { retries: 2, delay: 1000 } }, adapter);
    const controller = new AbortController();
    const pending = service
      .getRate('EUR', 'USD', {}, { signal: controller.signal })
      .catch((error: unknown) => error);
    await jest.advanceTimersByTimeAsync(0);
    controller.abort();
    expect(await pending).toMatchObject({ code: 'ERR_CANCELED' });
    await jest.advanceTimersByTimeAsync(10000);
    expect(adapter).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('keeps concurrent requests independent', async () => {
    const counts = new Map<string, number>();
    const adapter: AxiosAdapter = (config) => {
      const path = config.url ?? '';
      const count = (counts.get(path) ?? 0) + 1;
      counts.set(path, count);
      return count === 1
        ? Promise.reject(failure(config, 503))
        : Promise.resolve(response(config));
    };
    const { service } = setup({ retry: { retries: 1, delay: 0 } }, adapter);
    const pending = Promise.all([
      service.getRate('EUR', 'USD'),
      service.getRate('GBP', 'USD'),
    ]);
    await jest.advanceTimersByTimeAsync(0);
    await pending;
    expect([...counts.values()]).toEqual([2, 2]);
  });

  it('runs the configuration hook once and retains consumer interceptors when removing retry handlers', async () => {
    const adapter = jest.fn((config: InternalAxiosRequestConfig) =>
      Promise.resolve(response(config)),
    );
    const configureAxios = jest.fn((client: HttpService['axiosRef']) => {
      client.defaults.adapter = adapter;
      client.interceptors.request.use((request) => {
        request.headers.set('X-Consumer', 'configured');
        return request;
      });
    });
    const { service, client } = setup(
      { configureAxios, retry: { retries: 1 } },
      () => Promise.reject(new Error('wrong adapter')),
    );
    await service.getRate('EUR', 'USD');
    service.onModuleDestroy();
    await service.getRate('EUR', 'USD');
    expect(configureAxios).toHaveBeenCalledTimes(1);
    expect(adapter).toHaveBeenCalledTimes(2);
    expect(adapter.mock.calls[0][0].headers.get('X-Consumer')).toBe(
      'configured',
    );
    expect(client.defaults.adapter).toBe(adapter);
  });

  it('does not retry requests changed to a non-idempotent method by a hook', async () => {
    const adapter = jest.fn((config: InternalAxiosRequestConfig) =>
      Promise.reject(failure(config, 503)),
    );
    const { service } = setup(
      {
        retry: { retries: 1 },
        configureAxios: (client) => {
          client.interceptors.request.use((config) => {
            config.method = 'post';
            return config;
          });
        },
      },
      adapter,
    );
    await expect(service.getRate('EUR', 'USD')).rejects.toMatchObject({
      status: 503,
    });
    expect(adapter).toHaveBeenCalledTimes(1);
  });

  it.each([
    { retries: -1 },
    { retries: 0.5 },
    { delay: -1 },
    { maxDelay: 10, delay: 20 },
    { totalTimeout: 0 },
    { totalTimeout: Infinity },
    { statusCodes: [399] },
    { statusCodes: [600] },
  ])('rejects invalid retry configuration %j', (retry) => {
    expect(() =>
      setup({ retry }, (config) => Promise.resolve(response(config))),
    ).toThrow(TypeError);
  });
});
