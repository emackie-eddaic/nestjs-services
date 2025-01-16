import { WebServiceClient } from '@maxmind/geoip2-node';
import { Inject, Injectable } from '@nestjs/common';
import { MODULE_OPTIONS_TOKEN } from './maxmind-geoip2.module-definition';
import { MaxmindGeoip2Configuration } from './type';

@Injectable()
export class MaxmindGeoip2Service {
  public client: WebServiceClient;

  /**
   * Initializes a WebServiceClient using the provided configuration.
   *
   * Empty strings are set for `accountId` and `licenseKey` if not provided.
   * This will result in the client throwing errors when making requests.
   *
   * @param configuration
   */
  constructor(
    @Inject(MODULE_OPTIONS_TOKEN) configuration: MaxmindGeoip2Configuration,
  ) {
    const { accountId = '', licenseKey = '', options } = configuration;
    this.client = new WebServiceClient(accountId, licenseKey, options);
  }

  /**
   * Shorthand function to call client.city(ip)
   * @param ip
   * @returns
   */
  city(ip: string) {
    return this.client.city(ip);
  }

  /**
   * Shorthand function to call client.country(ip)
   * @param ip
   * @returns
   */
  country(ip: string) {
    return this.client.country(ip);
  }

  /**
   * Shorthand function to call client.insights(ip)
   * @param ip
   * @returns
   */
  insights(ip: string) {
    return this.client.insights(ip);
  }
}
