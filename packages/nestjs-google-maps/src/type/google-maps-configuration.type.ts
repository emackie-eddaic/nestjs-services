import type { ClientOptions } from '@googlemaps/google-maps-services-js';

/** Options for constructing the client exposed by `GoogleMapsService`. */
export type GoogleMapsConfiguration = {
  /** Official client options, including Axios configuration or a custom instance. */
  config?: ClientOptions;
};
