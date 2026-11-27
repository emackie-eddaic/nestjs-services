import type { PlacesClient } from '@googlemaps/places';

/** Options for constructing the client exposed by `GooglePlacesService`. */
export type GooglePlacesConfiguration = {
  /** Official client constructor options, including API keys or ADC settings. */
  config?: ConstructorParameters<typeof PlacesClient>[0];
};
