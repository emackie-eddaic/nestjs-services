import { HttpService } from '@nestjs/axios';
import { FrankfurterService } from './frankfurter.service';
import { FrankfurterResponseValidationError } from './frankfurter-response-validation.error';

const rate = { date: '2026-01-02', base: 'EUR', quote: 'USD', rate: 1.1 };
function setup(data: unknown) {
  const received = jest.fn();
  const client = new HttpService().axiosRef.create({
    adapter: (config) => {
      received();
      return Promise.resolve({
        data,
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      });
    },
  });
  return {
    service: new FrankfurterService(
      { retry: { retries: 2 } },
      new HttpService(client),
    ),
    received,
  };
}

describe('Frankfurter response validation', () => {
  it.each([
    ['rates', (s: FrankfurterService) => s.getRates()],
    ['rate', (s: FrankfurterService) => s.getRate('EUR', 'USD')],
    ['coverage', (s: FrankfurterService) => s.getCoverage()],
    ['currencies', (s: FrankfurterService) => s.getCurrencies()],
    ['currency', (s: FrankfurterService) => s.getCurrency('EUR')],
    ['providers', (s: FrankfurterService) => s.getProviders()],
    ['provider', (s: FrankfurterService) => s.getProvider('ECB')],
    ['provider rates', (s: FrankfurterService) => s.getProviderRates('ECB')],
    [
      'provider rate',
      (s: FrankfurterService) => s.getProviderRate('ECB', 'EUR', 'USD'),
    ],
  ] as const)(
    'validates %s without retrying malformed successes',
    async (_name, call) => {
      const body = { unexpected: true };
      const { service, received } = setup(body);
      const error: unknown = await call(service).catch(
        (error: unknown) => error,
      );
      expect(error).toBeInstanceOf(FrankfurterResponseValidationError);
      if (!(error instanceof FrankfurterResponseValidationError))
        throw new Error('Expected validation error');
      expect(error.body).toBe(body);
      expect(error.status).toBe(200);
      expect(error.issues.length).toBeGreaterThan(0);
      expect(error.issues[0].path).toMatch(/^\$/);
      expect(received).toHaveBeenCalledTimes(1);
    },
  );

  it.each([
    { ...rate, rate: '1.1' },
    { ...rate, rate: 0 },
    { ...rate, rate: -1 },
    { ...rate, rate: Infinity },
    { ...rate, date: '2026-02-30' },
    {
      ...rate,
      providers: [{ key: 'ECB', date: rate.date, rate: 1, excluded: 'yes' }],
    },
  ])('rejects invalid rate fields: %j', async (body) => {
    const { service } = setup(body);
    await expect(service.getRate('EUR', 'USD')).rejects.toBeInstanceOf(
      FrankfurterResponseValidationError,
    );
  });

  it('retains unknown fields, including nested observations', async () => {
    const body = {
      ...rate,
      future: true,
      providers: [
        { key: 'ECB', date: rate.date, rate: 1.1, future: { enabled: true } },
      ],
    };
    const { service } = setup(body);
    await expect(service.getRate('EUR', 'USD')).resolves.toEqual(body);
  });

  it('accepts nullable coverage bounds and empty rate arrays', async () => {
    const body = {
      base: 'EUR',
      quotes: null,
      providers: null,
      start_date: null,
      end_date: null,
    };
    await expect(setup(body).service.getCoverage()).resolves.toEqual(body);
    await expect(setup([]).service.getRates()).resolves.toEqual([]);
  });

  it('validates provider datasets and preserves future metadata', async () => {
    const body = {
      key: 'ECB',
      name: 'European Central Bank',
      currencies: [],
      datasets: [
        {
          key: 'ECB',
          default: true,
          currencies: [],
          start_date: null,
          publishes_missed: null,
          extra: 'future',
        },
      ],
      publish_cadence: null,
    };
    await expect(setup(body).service.getProvider('ECB')).resolves.toEqual(body);
    const invalid = { ...body, datasets: [{ key: 'ECB', currencies: [] }] };
    await expect(
      setup(invalid).service.getProvider('ECB'),
    ).rejects.toMatchObject({ issues: [{ path: '$.datasets.0.default' }] });
  });

  it('validates currency enums and peg metadata', async () => {
    const valid = {
      iso_code: 'USD',
      name: 'Dollar',
      type: 'currency',
      iso_numeric: null,
      symbol: null,
      peg: {
        base: 'EUR',
        rate: 1,
        source: 'https://example.test/peg',
        future: 1,
      },
    };
    await expect(setup(valid).service.getCurrency('USD')).resolves.toEqual(
      valid,
    );
    await expect(
      setup({ ...valid, type: 'other' }).service.getCurrency('USD'),
    ).rejects.toBeInstanceOf(FrankfurterResponseValidationError);
    await expect(
      setup({ ...valid, peg: { rate: 'one' } }).service.getCurrency('USD'),
    ).rejects.toBeInstanceOf(FrankfurterResponseValidationError);
  });
});
