# nestjs-frankfurter-v2

A configurable NestJS HTTP client for the [Frankfurter v2 API](https://frankfurter.dev/), exposing typed JSON methods for exchange rates, currencies, providers, and queryable history coverage.

## Compatibility and installation

Supports NestJS 11 and 12 with CommonJS JavaScript and TypeScript declarations for CommonJS and ESM consumers. Use `@nestjs/axios` 4 with NestJS 11, or `@nestjs/axios` 12 with NestJS 11 or 12. The runtime must support your selected NestJS and `@nestjs/axios` versions.

```sh
npm install @eddaic/nestjs-frankfurter-v2 @nestjs/axios rxjs
```

## Configuration

Import `FrankfurterModule` directly for public API defaults, or configure it synchronously:

```typescript
import { Module } from '@nestjs/common';
import { FrankfurterModule } from '@eddaic/nestjs-frankfurter-v2';

@Module({
  imports: [FrankfurterModule.register({ timeout: 5000 })],
})
export class AppModule {}
```

For injected configuration (`@nestjs/config` is optional and installed by the application):

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FrankfurterModule } from '@eddaic/nestjs-frankfurter-v2';

@Module({
  imports: [
    ConfigModule.forRoot(),
    FrankfurterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        baseUrl: config.get<string>('FRANKFURTER_BASE_URL'),
        timeout: 5000,
      }),
    }),
  ],
})
export class AppModule {}
```

| Option    | Default                          | Meaning                                                                                                                                                 |
| --------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl` | `https://api.frankfurter.dev/v2` | Complete versioned HTTP(S) API URL, including any self-hosted path prefix. Trailing slashes are removed; credentials, query, and fragment are rejected. |
| `timeout` | `10000`                          | Integer milliseconds, from 1 through 2147483647. Invalid values fail during service construction.                                                       |
| `headers` | none                             | Additional request headers, including authentication for a self-hosted instance. `Accept` is always `application/json`.                                 |

The public API requires no API key. The wrapper returns parsed JSON; it does not request CSV or stream NDJSON. Caching is left to the application. Retries are opt-in through the Axios-layer policy below.

## Axios configuration and retries

```typescript
FrankfurterModule.register({
  timeout: 5000,
  retry: {
    retries: 2,
    delay: 200,
    maxDelay: 5000,
    totalTimeout: 15000,
  },
  configureAxios: (axios) => {
    axios.defaults.maxRedirects = 3;
    axios.interceptors.request.use((request) => {
      request.headers.set('X-Application', 'billing');
      return request;
    });
  },
});
```

`configureAxios` is a synchronous hook called once during construction with the module's isolated Axios instance. Use it for adapters, agents, proxy settings, defaults, and interceptors. It also works in `registerAsync` factory results. Each configured module owns its transport. Exceptions in the hook fail service construction.

The wrapper supplies the URL, query, timeout, Accept header, JSON response parser, and caller signal on each request; these take precedence over Axios defaults. Request interceptors can intentionally override request values, and response interceptors run before runtime validation. Consumer interceptors are installed before the built-in retry interceptors; response hooks therefore see failures before retry handling and request hooks run on every attempt. Avoid installing a second retry policy on the same instance, since nested policies can multiply attempts.

| Retry option    | Default                     | Meaning                                                                                                                     |
| --------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `retries`       | `0`                         | Maximum additional attempts; zero disables retries.                                                                         |
| `delay`         | `100`                       | Initial exponential backoff cap in milliseconds; full jitter selects a delay below the cap. Zero allows immediate retries.  |
| `maxDelay`      | `30000`                     | Maximum backoff cap; must be at least `delay`. A longer `Retry-After` stops retries rather than retrying early.             |
| `totalTimeout`  | module `timeout`            | Total budget in milliseconds for Axios attempts and retry delays. Each attempt's timeout is capped by the remaining budget. |
| `statusCodes`   | `[429, 500, 502, 503, 504]` | Explicit HTTP status allowlist; integers from 400 through 599.                                                              |
| `retryTimeouts` | `false`                     | Also retry Axios `ECONNABORTED` and `ETIMEDOUT` failures.                                                                   |

Counts and delays must be integers from zero through 2147483647; `totalTimeout` must be positive. Invalid retry configuration fails service construction. If another attempt or its delay cannot fit the budget, the last HTTP/transport error is returned. `timeout` remains the per-attempt ceiling, while `totalTimeout` limits the sequence. Axios transport adapters must honor `timeout` and `signal`; custom adapters are responsible for implementing them.

Only GET requests are retried. In addition to allowed HTTP statuses, transient transport codes `ERR_NETWORK`, `ECONNRESET`, `ECONNREFUSED`, `EAI_AGAIN`, `ENOTFOUND`, and `EPIPE` are eligible. Cancellation, malformed JSON, schema validation failures, and other errors are not retried. A valid `Retry-After` in seconds or HTTP-date form establishes a minimum wait; otherwise the client uses backoff with jitter. Abort signals cancel pending retry delays immediately. Retry state is separate for every request, and only the built-in handlers are removed when Nest destroys the service.

## Service methods

Inject `FrankfurterService` into your application service:

```typescript
import { Injectable } from '@nestjs/common';
import { FrankfurterService } from '@eddaic/nestjs-frankfurter-v2';

@Injectable()
export class ExchangeRatesService {
  constructor(private readonly frankfurter: FrankfurterService) {}

  cadToUsd() {
    return this.frankfurter.getRate('CAD', 'USD', { providers: ['BOC'] });
  }

  monthlyHistory() {
    return this.frankfurter.getRates({
      base: 'CAD',
      quotes: ['USD', 'EUR'],
      from: '2025-01-01',
      to: '2025-12-31',
      group: 'month',
    });
  }
}
```

| Method                                             | Return type                          | Options                                                              |
| -------------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------- |
| `getRates(options?)`                               | `Promise<FrankfurterRate[]>`         | `base`, `quotes`, `providers`, date selection, `expand: 'providers'` |
| `getRate(base, quote, options?)`                   | `Promise<FrankfurterRate>`           | `date`, `providers`                                                  |
| `getCoverage(options?)`                            | `Promise<FrankfurterCoverage>`       | `base`, `quotes`, `providers`                                        |
| `getCurrencies(options?)`                          | `Promise<FrankfurterCurrency[]>`     | `scope: 'all'`, `providers`                                          |
| `getCurrency(code)`                                | `Promise<FrankfurterCurrencyDetail>` | —                                                                    |
| `getProviders()`                                   | `Promise<FrankfurterProvider[]>`     | —                                                                    |
| `getProvider(provider)`                            | `Promise<FrankfurterProvider>`       | —                                                                    |
| `getProviderRates(provider, options?)`             | `Promise<FrankfurterRate[]>`         | `base`, `quotes`, date selection, `expand: 'providers'`              |
| `getProviderRate(provider, base, quote, options?)` | `Promise<FrankfurterRate>`           | `date`                                                               |

`quotes` and `providers` accept readonly string arrays and are serialized as comma-separated parameters. Provider/dataset keys and currency/asset codes are open strings; the API determines availability. Provider routes select their source through the path and do not accept a `providers` option.

Omit date parameters for latest rates. Use `date: 'YYYY-MM-DD'` for a historical lookup or `from`/`to` for a range, optionally with `group: 'week' | 'month'`. A single date cannot be combined with a range or grouping; types and runtime checks enforce this. Other input and availability validation is delegated to the API.

Each method accepts an additional final `FrankfurterRequestOptions` argument for cancellation:

```typescript
const controller = new AbortController();
const pending = frankfurter.getRates(
  { base: 'CAD', quotes: ['USD'] },
  { signal: controller.signal },
);
// Pass pending to code that handles completion or FrankfurterApiError rejection.
```

## Responses and errors

Results preserve upstream field names and date strings, including nullable/optional metadata. A rate is `{ date, base, quote, rate, providers? }`; rate lists are flat arrays rather than maps. Expanded provider observations retain their own dates and any `excluded` flag. Every successful response is validated against its endpoint's v2 schema, including required fields, arrays, nested provider/dataset metadata, date formats, positive finite rates, and documented enums. Optional/nullable fields follow the API contract. Additional fields are accepted and retained, including nested additions; values are not coerced or defaulted. A response with missing or incompatible fields is rejected before it reaches application code.

Request failures throw exported `FrankfurterApiError`, which extends `Error`:

- `status`: upstream HTTP status, absent for transport failures.
- `body`: upstream response data, including non-JSON error bodies.
- `message`: upstream JSON message when available, otherwise the original error message.
- `code`: Axios failure code, e.g. `ECONNABORTED`/`ETIMEDOUT` for timeouts or `ERR_CANCELED` for cancellation.
- `cause`: original failure.

Schema mismatches throw exported `FrankfurterResponseValidationError` with `body`, HTTP `status`, and `issues` containing field `path` and `message`. This error is separate from `FrankfurterApiError`; handle it as an unexpected upstream contract change. Invalid JSON continues to throw `FrankfurterApiError` with the parsing failure as its cause. Validation does not affect the HTTP error-body preservation described above.

Invalid configuration and conflicting date options throw `TypeError`.

## Rate semantics

Frankfurter serves reference rates rather than live market prices. The default feed blends sources; use `providers` or the provider methods when you need a particular authority. Observe each provider's terms when using its data.

Use returned observation dates rather than assuming the requested date had a publication. Currency/provider publication dates do not guarantee a queryable pair; use `getCoverage` for pair history bounds, which can be null and can contain interior gaps.

Large provider-filtered or expanded date ranges have upstream limits; see the [OpenAPI specification](https://api.frankfurter.dev/v2/openapi.json). Narrow quotes, aggregate, or split requests as appropriate. Cache deliberately in the application; blended historical rates can change as data arrives. For audit records, retain the rate, date, and provider attribution.

There is no conversion endpoint. Applications own amount multiplication, decimal precision, and rounding policy.
