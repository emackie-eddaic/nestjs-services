export type MaxmindGeoip2Configuration = {
  accountId?: string;
  licenseKey?: string;
  options?:
    | {
        host?: string;
        timeout?: number;
      }
    | number;
};
