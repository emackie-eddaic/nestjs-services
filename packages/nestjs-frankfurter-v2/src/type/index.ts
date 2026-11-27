import type { HttpService } from '@nestjs/axios';

/** Transport defaults for the Frankfurter v2 client. */
export type FrankfurterConfiguration = {
  /** Complete versioned API URL. Defaults to https://api.frankfurter.dev/v2. */
  baseUrl?: string;
  /** Positive timeout in milliseconds. Defaults to 10000. */
  timeout?: number;
  /** Additional headers, e.g. authentication for a self-hosted instance. */
  headers?: Record<string, string>;
  /** Retry policy. Disabled unless retries is greater than zero. */
  retry?: FrankfurterRetryOptions;
  /** Called synchronously once with this module's isolated Axios instance. */
  configureAxios?: (instance: HttpService['axiosRef']) => void;
};

/** Axios retry policy; all durations are milliseconds. */
export type FrankfurterRetryOptions = {
  /** Number of additional attempts, default 0. */
  retries?: number;
  /** Initial exponential backoff cap, default 100; full jitter is applied. */
  delay?: number;
  /** Maximum backoff/Retry-After delay, default 30000. Longer server delays stop retries. */
  maxDelay?: number;
  /** Budget across attempts and delays, defaulting to the module timeout. */
  totalTimeout?: number;
  /** Retriable HTTP statuses, default [429, 500, 502, 503, 504]. */
  statusCodes?: readonly number[];
  /** Retry Axios timeout errors too, default false. */
  retryTimeouts?: boolean;
};

/** Per-call cancellation, independent of the module timeout. */
export type FrankfurterRequestOptions = { signal?: AbortSignal };

export type FrankfurterCoverageOptions = {
  base?: string;
  quotes?: readonly string[];
  providers?: readonly string[];
};

/** A single date and a date range are mutually exclusive. Dates use YYYY-MM-DD. */
export type FrankfurterDateOptions =
  | { date?: string; from?: never; to?: never; group?: never }
  | { date?: never; from?: string; to?: string; group?: 'week' | 'month' };

export type FrankfurterRatesOptions = FrankfurterCoverageOptions &
  FrankfurterDateOptions & { expand?: 'providers' };
export type FrankfurterRateOptions = {
  date?: string;
  providers?: readonly string[];
};
export type FrankfurterProviderRatesOptions = Omit<
  FrankfurterCoverageOptions,
  'providers'
> &
  FrankfurterDateOptions & { expand?: 'providers' };
export type FrankfurterProviderRateOptions = { date?: string };
export type FrankfurterCurrenciesOptions = {
  scope?: 'all';
  providers?: readonly string[];
};

export type FrankfurterProviderObservation = {
  key: string;
  date: string;
  rate: number;
  excluded?: boolean;
};
export type FrankfurterRate = {
  date: string;
  base: string;
  quote: string;
  rate: number;
  /** May be omitted even when expanded, for synthesized peg rows. */
  providers?: FrankfurterProviderObservation[];
};
export type FrankfurterCoverage = {
  base: string;
  quotes: string[] | null;
  providers: string[] | null;
  start_date: string | null;
  end_date: string | null;
};
export type FrankfurterCurrency = {
  iso_code: string;
  iso_numeric?: string | null;
  name: string;
  symbol?: string | null;
  type: 'currency' | 'metal' | 'crypto';
  start_date?: string | null;
  end_date?: string | null;
};
export type FrankfurterCurrencyDetail = Omit<
  FrankfurterCurrency,
  'start_date' | 'end_date'
> & {
  providers?: string[];
  peg?: { base?: string; rate?: number; authority?: string; source?: string };
};
export type FrankfurterFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly';

type Publication = {
  rate_type?: string | null;
  pivot_currency?: string | null;
  data_url?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  publish_cadence?: FrankfurterFrequency | null;
  frequency?: FrankfurterFrequency;
  publishes_missed?: number | null;
  currencies: string[];
  unknown_currencies?: string[];
};
export type FrankfurterDataset = Publication & {
  key: string;
  default: boolean;
};
export type FrankfurterProvider = Publication & {
  key: string;
  name: string;
  country_code?: string | null;
  terms_url?: string | null;
  datasets: FrankfurterDataset[];
};
