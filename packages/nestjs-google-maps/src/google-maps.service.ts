import { Client } from '@googlemaps/google-maps-services-js';
import { Inject, Injectable } from '@nestjs/common';
import { MODULE_OPTIONS_TOKEN } from './google-maps.module-definition';
import type { GoogleMapsConfiguration } from './type';

/**
 * Provides a configured official Google Maps Services JS client.
 *
 * @remarks
 * Call `client` methods directly and supply authentication parameters in each
 * request. The service does not store credentials or provide API helpers.
 *
 * @see {@link https://github.com/googlemaps/google-maps-services-js | Google Maps Services JS}
 */
@Injectable()
export class GoogleMapsService {
  /** The configured official client for direct API calls. */
  readonly client: Client;

  /**
   * Creates the client using configuration supplied by `GoogleMapsModule`.
   *
   * @param configuration - Options for constructing the official client.
   */
  constructor(
    @Inject(MODULE_OPTIONS_TOKEN) configuration: GoogleMapsConfiguration,
  ) {
    this.client = new Client(configuration.config);
  }
}
