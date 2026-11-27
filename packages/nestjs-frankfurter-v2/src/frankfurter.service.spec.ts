import { HttpService } from '@nestjs/axios';
import axios, {
  AxiosError,
  CanceledError,
  AxiosHeaders,
  type AxiosAdapter,
  type InternalAxiosRequestConfig,
} from 'axios';
import { FrankfurterApiError } from './frankfurter-api.error';
import { FrankfurterService } from './frankfurter.service';
import type { FrankfurterConfiguration, FrankfurterRatesOptions } from './type';

const rate = { date: '2026-01-02', base: 'EUR', quote: 'USD', rate: 1.1 };

function setup(config: FrankfurterConfiguration = {}) {
  const received = jest.fn<void, [InternalAxiosRequestConfig]>();
  let data: unknown;
  let overridden = false;
  const adapter: AxiosAdapter = (request) => {
    received(request);
    const path = request.url ?? '';
    const fallback = path.endsWith('/rates')
      ? [rate]
      : path.includes('/rate/')
        ? rate
        : path.endsWith('/coverage')
          ? {
              base: 'EUR',
              quotes: null,
              providers: null,
              start_date: null,
              end_date: null,
            }
          : path.endsWith('/currencies') || path.endsWith('/providers')
            ? []
            : path.includes('/currency/')
              ? { iso_code: 'EUR', name: 'Euro', type: 'currency' }
              : { key: 'ECB', name: 'ECB', currencies: [], datasets: [] };
    return Promise.resolve({
      data: overridden ? data : fallback,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: request,
    });
  };
  const client = axios.create({ adapter });
  return {
    service: new FrankfurterService(config, new HttpService(client)),
    client,
    received,
    respond: (value: unknown) => {
      data = value;
      overridden = true;
    },
  };
}

describe('FrankfurterService', () => {
  it('uses JSON, the public v2 URL, and a finite timeout by default', async () => {
    const { service, received } = setup();
    expect(await service.getRate('EUR', 'USD')).toEqual(rate);
    const [request] = received.mock.calls[0];
    expect(request.url).toBe('https://api.frankfurter.dev/v2/rate/EUR/USD');
    expect(request.method).toBe('get');
    expect(request.timeout).toBe(10000);
    expect(request.headers.get('Accept')).toBe('application/json');
    expect(request.responseType).toBe('json');
    expect(request.params).toBeInstanceOf(URLSearchParams);
    expect(String(request.params)).toBe('');
  });

  it('applies self-hosted defaults without allowing headers to change the format', async () => {
    const { service, received } = setup({
      baseUrl: 'https://example.test/api/v2///',
      timeout: 2345,
      headers: { Authorization: 'Bearer local-test', accept: 'text/csv' },
    });
    await service.getRates();
    const [request] = received.mock.calls[0];
    expect(request.url).toBe('https://example.test/api/v2/rates');
    expect(request.timeout).toBe(2345);
    expect(request.headers.get('Authorization')).toBe('Bearer local-test');
    expect(request.headers.get('Accept')).toBe('application/json');
  });

  it.each([
    ['rates', (s: FrankfurterService) => s.getRates(), '/rates', [rate]],
    [
      'rate',
      (s: FrankfurterService) => s.getRate('EUR', 'USD'),
      '/rate/EUR/USD',
      rate,
    ],
    [
      'coverage',
      (s: FrankfurterService) => s.getCoverage(),
      '/coverage',
      {
        base: 'EUR',
        quotes: null,
        providers: null,
        start_date: null,
        end_date: null,
      },
    ],
    [
      'currencies',
      (s: FrankfurterService) => s.getCurrencies(),
      '/currencies',
      [{ iso_code: 'EUR', name: 'Euro', type: 'currency' }],
    ],
    [
      'currency',
      (s: FrankfurterService) => s.getCurrency('EUR'),
      '/currency/EUR',
      { iso_code: 'EUR', name: 'Euro', type: 'currency', providers: ['ECB'] },
    ],
    [
      'providers',
      (s: FrankfurterService) => s.getProviders(),
      '/providers',
      [{ key: 'ECB', name: 'ECB', currencies: ['EUR'], datasets: [] }],
    ],
    [
      'provider',
      (s: FrankfurterService) => s.getProvider('ECB'),
      '/providers/ECB',
      { key: 'ECB', name: 'ECB', currencies: ['EUR'], datasets: [] },
    ],
    [
      'provider rates',
      (s: FrankfurterService) => s.getProviderRates('NBP.B'),
      '/providers/NBP.B/rates',
      [rate],
    ],
    [
      'provider rate',
      (s: FrankfurterService) => s.getProviderRate('ECB', 'EUR', 'USD'),
      '/providers/ECB/rate/EUR/USD',
      rate,
    ],
  ] as const)(
    'maps %s and preserves its response',
    async (_name, call, path, data) => {
      const { service, received, respond } = setup();
      respond(data);
      expect(await call(service)).toEqual(data);
      expect(received.mock.calls[0][0].url).toBe(
        `https://api.frankfurter.dev/v2${path}`,
      );
    },
  );

  it('serializes arrays as comma-separated values and retains observation dates', async () => {
    const { service, received, respond } = setup();
    const expanded = [
      {
        ...rate,
        providers: [
          { key: 'ECB', date: '2026-01-01', rate: 1.2, excluded: true },
        ],
      },
    ];
    respond(expanded);
    const options = {
      base: 'CAD',
      quotes: ['USD', 'GBP'],
      providers: ['ECB', 'NBP.B'],
      from: '2026-01-01',
      to: '2026-02-01',
      group: 'week',
      expand: 'providers',
    } as const;
    expect(await service.getRates(options)).toEqual(expanded);
    expect(String(received.mock.calls[0][0].params)).toBe(
      'base=CAD&quotes=USD%2CGBP&providers=ECB%2CNBP.B&from=2026-01-01&to=2026-02-01&group=week&expand=providers',
    );
    expect(options.quotes).toEqual(['USD', 'GBP']);
  });

  it('forwards endpoint-specific filters and omits undefined fields', async () => {
    const { service, received } = setup();
    await service.getRate('CAD', 'USD', {
      date: '2026-01-01',
      providers: ['BOC'],
    });
    await service.getCoverage({
      base: 'CAD',
      quotes: ['USD'],
      providers: undefined,
    });
    await service.getCurrencies({ scope: 'all', providers: ['ECB'] });
    await service.getProviderRates('ECB', {
      base: 'CAD',
      date: '2026-01-01',
      expand: 'providers',
    });
    await service.getProviderRate('ECB', 'CAD', 'USD', { date: '2026-01-01' });
    expect(
      received.mock.calls.map(([request]) => String(request.params)),
    ).toEqual([
      'date=2026-01-01&providers=BOC',
      'base=CAD&quotes=USD',
      'scope=all&providers=ECB',
      'base=CAD&date=2026-01-01&expand=providers',
      'date=2026-01-01',
    ]);
  });

  it('parses JSON and rejects malformed successful responses', async () => {
    const { service, respond } = setup();
    respond(JSON.stringify([rate]));
    await expect(service.getRates()).resolves.toEqual([rate]);
    respond('{malformed');
    const error: unknown = await service
      .getRates()
      .catch((error: unknown) => error);
    expect(error).toBeInstanceOf(FrankfurterApiError);
    expect(
      error instanceof FrankfurterApiError ? error.cause : undefined,
    ).toBeInstanceOf(SyntaxError);
  });

  it('encodes caller-provided path segments', async () => {
    const { service, received } = setup();
    await service.getProviderRate('ECB/other?x=1', 'E/U', 'U#D');
    expect(received.mock.calls[0][0].url).toBe(
      'https://api.frankfurter.dev/v2/providers/ECB%2Fother%3Fx%3D1/rate/E%2FU/U%23D',
    );
  });

  it.each(['from', 'to', 'group'])(
    'rejects date combined with %s at runtime',
    async (key) => {
      const { service, received } = setup();
      const invalid = {
        date: '2026-01-01',
        [key]: '2026-01-02',
      } as FrankfurterRatesOptions;
      await expect(service.getRates(invalid)).rejects.toThrow(TypeError);
      expect(received).not.toHaveBeenCalled();
    },
  );

  it.each([0, -1, NaN, Infinity, 1.5, 2147483648])(
    'rejects invalid timeout %s',
    (timeout) => {
      expect(() => setup({ timeout })).toThrow(TypeError);
    },
  );
  it.each([
    'ftp://example.test/v2',
    'https://user:secret@example.test/v2',
    'https://example.test/v2?x=1',
    'https://example.test/v2#x',
    '/v2',
  ])('rejects invalid baseUrl %s', (baseUrl) => {
    expect(() => setup({ baseUrl })).toThrow(TypeError);
  });

  it.each([400, 404, 422, 429, 503])(
    'preserves HTTP %s status, upstream message, body and cause',
    async (status) => {
      const { service, client } = setup();
      const body = { status, message: 'invalid currency: ABC' };
      const cause = new AxiosError(
        'Request failed',
        'ERR_BAD_RESPONSE',
        undefined,
        undefined,
        {
          data: body,
          status,
          statusText: 'Error',
          headers: {},
          config: { headers: new AxiosHeaders() },
        },
      );
      client.defaults.adapter = () => Promise.reject(cause);
      const error: unknown = await service
        .getRate('ABC', 'USD')
        .catch((error: unknown) => error);
      expect(error).toBeInstanceOf(FrankfurterApiError);
      expect(error).toMatchObject({
        status,
        body,
        message: body.message,
        code: 'ERR_BAD_RESPONSE',
        cause,
      });
    },
  );

  it.each(['ECONNABORTED', 'ETIMEDOUT', 'ENOTFOUND'])(
    'distinguishes transport failure %s without inventing a status',
    async (code) => {
      const { service, client } = setup();
      const cause = new AxiosError('Transport failed', code);
      client.defaults.adapter = () => Promise.reject(cause);
      await expect(service.getProviders()).rejects.toMatchObject({
        name: 'FrankfurterApiError',
        status: undefined,
        body: undefined,
        code,
        cause,
      });
    },
  );

  it('preserves non-JSON error bodies and the original message', async () => {
    const { service, client } = setup();
    const cause = new AxiosError(
      'Service unavailable',
      undefined,
      undefined,
      undefined,
      {
        data: '<html>Unavailable</html>',
        status: 503,
        statusText: 'Unavailable',
        headers: {},
        config: { headers: new AxiosHeaders() },
      },
    );
    client.defaults.adapter = () => Promise.reject(cause);
    await expect(service.getProviders()).rejects.toMatchObject({
      status: 503,
      body: '<html>Unavailable</html>',
      message: 'Service unavailable',
      cause,
    });
  });

  it.each([
    [302, '<html>Moved</html>'],
    [304, ''],
  ] as const)(
    'preserves terminal HTTP %s failures with non-JSON bodies',
    async (status, body) => {
      const { service, client } = setup();
      const cause = new AxiosError(
        `Request failed with status code ${status}`,
        undefined,
        undefined,
        undefined,
        {
          data: body,
          status,
          statusText: 'Redirect',
          headers: {},
          config: { headers: new AxiosHeaders() },
        },
      );
      client.defaults.adapter = () => Promise.reject(cause);
      const error: unknown = await service
        .getProviders()
        .catch((error: unknown) => error);
      expect(error).toBeInstanceOf(FrankfurterApiError);
      expect(error).toMatchObject({ status, body, message: cause.message });
      expect(
        error instanceof FrankfurterApiError ? error.cause : undefined,
      ).toBe(cause);
    },
  );

  it('supports cancellation and never dispatches an already-aborted request', async () => {
    const { service, received } = setup();
    const controller = new AbortController();
    await service.getRates({}, { signal: controller.signal });
    expect(received.mock.calls[0][0].signal?.aborted).toBe(false);
    controller.abort();
    await expect(
      service.getRates({}, { signal: controller.signal }),
    ).rejects.toMatchObject({
      name: 'FrankfurterApiError',
      code: 'ERR_CANCELED',
    });
    expect(received).toHaveBeenCalledTimes(1);
  });

  it('cancels an in-flight request when the caller aborts', async () => {
    const { service, client } = setup();
    let dispatch!: () => void;
    const started = new Promise<void>((resolve) => {
      dispatch = resolve;
    });
    client.defaults.adapter = (request) =>
      new Promise((_resolve, reject) => {
        request.signal?.addEventListener?.('abort', () =>
          reject(new CanceledError('canceled')),
        );
        dispatch();
      });
    const controller = new AbortController();
    const pending = service.getRates({}, { signal: controller.signal });
    await started;
    controller.abort();
    await expect(pending).rejects.toMatchObject({
      name: 'FrankfurterApiError',
      code: 'ERR_CANCELED',
    });
  });

  it('wraps unexpected failures while retaining their cause', async () => {
    const { service, client } = setup();
    const cause = new Error('Unexpected failure');
    client.defaults.adapter = () => Promise.reject(cause);
    await expect(service.getProviders()).rejects.toMatchObject({
      message: cause.message,
      cause,
    });
    expect(new FrankfurterApiError('unknown')).toMatchObject({
      message: 'Frankfurter request failed',
      cause: 'unknown',
    });
  });
});
