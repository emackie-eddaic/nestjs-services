import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { AxiosHeaders, type AxiosResponseTransformer } from 'axios';
import { firstValueFrom } from 'rxjs';
import { FrankfurterApiError } from './frankfurter-api.error';
import { MODULE_OPTIONS_TOKEN } from './frankfurter.module-definition';
import type {
  FrankfurterConfiguration,
  FrankfurterRequestOptions,
  FrankfurterCoverageOptions,
  FrankfurterRatesOptions,
  FrankfurterRateOptions,
  FrankfurterProviderRatesOptions,
  FrankfurterProviderRateOptions,
  FrankfurterCurrenciesOptions,
  FrankfurterRate,
  FrankfurterCoverage,
  FrankfurterCurrency,
  FrankfurterCurrencyDetail,
  FrankfurterProvider,
} from './type';

type Query = Record<string, string | readonly string[] | undefined>;

// Parse successful JSON strictly, but retain non-JSON bodies for HTTP failures.
const parseResponse: AxiosResponseTransformer = (
  data: unknown,
  _headers,
  status,
) => {
  if (typeof data !== 'string') return data;
  try {
    return JSON.parse(data) as unknown;
  } catch (cause) {
    if (status !== undefined && (status < 200 || status >= 300)) return data;
    throw cause;
  }
};

/** Typed JSON methods for Frankfurter v2. Currency/provider codes remain open strings. */
@Injectable()
export class FrankfurterService {
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly headers: InstanceType<typeof AxiosHeaders>;

  constructor(
    @Inject(MODULE_OPTIONS_TOKEN) config: FrankfurterConfiguration,
    private readonly http: HttpService,
  ) {
    const baseUrl = config.baseUrl ?? 'https://api.frankfurter.dev/v2';
    const url = URL.canParse(baseUrl) ? new URL(baseUrl) : undefined;
    if (
      !url ||
      !['http:', 'https:'].includes(url.protocol) ||
      url.search ||
      url.hash ||
      url.username ||
      url.password
    ) {
      throw new TypeError(
        'Frankfurter baseUrl must be an HTTP(S) URL without credentials, query, or fragment',
      );
    }
    this.baseUrl = url.toString().replace(/\/+$/, '');
    this.timeout = config.timeout ?? 10000;
    if (
      !Number.isInteger(this.timeout) ||
      this.timeout <= 0 ||
      this.timeout > 2147483647
    ) {
      throw new TypeError(
        'Frankfurter timeout must be a positive integer no greater than 2147483647',
      );
    }
    this.headers = new AxiosHeaders(config.headers);
    this.headers.set('Accept', 'application/json');
  }

  getRates(
    options: FrankfurterRatesOptions = {},
    request?: FrankfurterRequestOptions,
  ): Promise<FrankfurterRate[]> {
    return this.get('/rates', options, request);
  }
  getRate(
    base: string,
    quote: string,
    options: FrankfurterRateOptions = {},
    request?: FrankfurterRequestOptions,
  ): Promise<FrankfurterRate> {
    return this.get(
      `/rate/${encodeURIComponent(base)}/${encodeURIComponent(quote)}`,
      options,
      request,
    );
  }
  getCoverage(
    options: FrankfurterCoverageOptions = {},
    request?: FrankfurterRequestOptions,
  ): Promise<FrankfurterCoverage> {
    return this.get('/coverage', options, request);
  }
  getCurrencies(
    options: FrankfurterCurrenciesOptions = {},
    request?: FrankfurterRequestOptions,
  ): Promise<FrankfurterCurrency[]> {
    return this.get('/currencies', options, request);
  }
  getCurrency(
    code: string,
    request?: FrankfurterRequestOptions,
  ): Promise<FrankfurterCurrencyDetail> {
    return this.get(`/currency/${encodeURIComponent(code)}`, {}, request);
  }
  getProviders(
    request?: FrankfurterRequestOptions,
  ): Promise<FrankfurterProvider[]> {
    return this.get('/providers', {}, request);
  }
  getProvider(
    provider: string,
    request?: FrankfurterRequestOptions,
  ): Promise<FrankfurterProvider> {
    return this.get(`/providers/${encodeURIComponent(provider)}`, {}, request);
  }
  getProviderRates(
    provider: string,
    options: FrankfurterProviderRatesOptions = {},
    request?: FrankfurterRequestOptions,
  ): Promise<FrankfurterRate[]> {
    return this.get(
      `/providers/${encodeURIComponent(provider)}/rates`,
      options,
      request,
    );
  }
  getProviderRate(
    provider: string,
    base: string,
    quote: string,
    options: FrankfurterProviderRateOptions = {},
    request?: FrankfurterRequestOptions,
  ): Promise<FrankfurterRate> {
    return this.get(
      `/providers/${encodeURIComponent(provider)}/rate/${encodeURIComponent(base)}/${encodeURIComponent(quote)}`,
      options,
      request,
    );
  }

  private async get<T>(
    path: string,
    query: Query,
    request?: FrankfurterRequestOptions,
  ): Promise<T> {
    if (
      query.date !== undefined &&
      (query.from !== undefined ||
        query.to !== undefined ||
        query.group !== undefined)
    ) {
      throw new TypeError(
        'Frankfurter date cannot be combined with from, to, or group',
      );
    }
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined)
        params.set(key, typeof value === 'string' ? value : value.join(','));
    }
    try {
      const response = await firstValueFrom(
        this.http.get<T>(`${this.baseUrl}${path}`, {
          params,
          timeout: this.timeout,
          headers: this.headers,
          responseType: 'json',
          signal: request?.signal,
          transformResponse: [parseResponse],
        }),
      );
      return response.data;
    } catch (cause) {
      throw new FrankfurterApiError(cause);
    }
  }
}
