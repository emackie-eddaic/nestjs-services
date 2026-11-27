import { z } from 'zod';
import type {
  FrankfurterRate,
  FrankfurterCoverage,
  FrankfurterCurrency,
  FrankfurterCurrencyDetail,
  FrankfurterProvider,
} from './type';

// Match the v2 OpenAPI schemas. Additional fields are retained at every level.
const date = z.iso.date();
const strings = z.array(z.string());
const currencyFields = {
  iso_code: z.string(),
  iso_numeric: z.string().nullable().optional(),
  name: z.string(),
  symbol: z.string().nullable().optional(),
  type: z.enum(['currency', 'metal', 'crypto']),
};
const frequency = z.enum(['daily', 'weekly', 'monthly', 'quarterly']);
const publicationFields = {
  rate_type: z.string().nullable().optional(),
  pivot_currency: z.string().nullable().optional(),
  data_url: z.url().nullable().optional(),
  start_date: date.nullable().optional(),
  end_date: date.nullable().optional(),
  publish_cadence: frequency.nullable().optional(),
  frequency: frequency.optional(),
  publishes_missed: z.number().int().nonnegative().nullable().optional(),
  currencies: strings,
  unknown_currencies: strings.optional(),
};
export const rateSchema: z.ZodType<FrankfurterRate> = z.looseObject({
  date,
  base: z.string(),
  quote: z.string(),
  rate: z.number().positive(),
  providers: z
    .array(
      z.looseObject({
        key: z.string(),
        date,
        rate: z.number().positive(),
        excluded: z.boolean().optional(),
      }),
    )
    .optional(),
});
export const coverageSchema: z.ZodType<FrankfurterCoverage> = z.looseObject({
  base: z.string(),
  quotes: strings.nullable(),
  providers: strings.nullable(),
  start_date: date.nullable(),
  end_date: date.nullable(),
});
export const currencySchema: z.ZodType<FrankfurterCurrency> = z.looseObject({
  ...currencyFields,
  start_date: date.nullable().optional(),
  end_date: date.nullable().optional(),
});
export const currencyDetailSchema: z.ZodType<FrankfurterCurrencyDetail> =
  z.looseObject({
    ...currencyFields,
    providers: strings.optional(),
    peg: z
      .looseObject({
        base: z.string().optional(),
        rate: z.number().optional(),
        authority: z.string().optional(),
        source: z.url().optional(),
      })
      .optional(),
  });
export const providerSchema: z.ZodType<FrankfurterProvider> = z.looseObject({
  ...publicationFields,
  key: z.string(),
  name: z.string(),
  country_code: z.string().nullable().optional(),
  terms_url: z.url().nullable().optional(),
  datasets: z.array(
    z.looseObject({
      ...publicationFields,
      key: z.string(),
      default: z.boolean(),
    }),
  ),
});
export const ratesSchema = z.array(rateSchema);
export const currenciesSchema = z.array(currencySchema);
export const providersSchema = z.array(providerSchema);
