import {
  ApiKeyParams,
  ClientOptions,
} from '@googlemaps/google-maps-services-js';

export type GoogleMapsConfiguration = {
  /**
   * Authentication parameters used by the deprecated convenience helpers.
   *
   * @deprecated This option will be removed with the helpers in the next major
   * release. It remains required until then. Supply authentication parameters
   * from your application configuration directly in client requests.
   */
  params: ApiKeyParams;
  config?: ClientOptions;
};
