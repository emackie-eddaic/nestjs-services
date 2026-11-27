import { PlacesClient } from '@googlemaps/places';
import { Inject, Injectable, type OnModuleDestroy } from '@nestjs/common';
import { MODULE_OPTIONS_TOKEN } from './google-places.module-definition';
import type { GooglePlacesConfiguration } from './type';

/** Provides the configured official Places API (New) client. */
@Injectable()
export class GooglePlacesService implements OnModuleDestroy {
  /** The official client for direct Places API calls. */
  readonly client: PlacesClient;

  /**
   * Creates the client with options supplied by `GooglePlacesModule`.
   *
   * @param configuration - Authentication, transport, and other client options.
   */
  constructor(
    @Inject(MODULE_OPTIONS_TOKEN) configuration: GooglePlacesConfiguration,
  ) {
    this.client = new PlacesClient(configuration.config);
  }

  /**
   * Releases client resources when Nest destroys the module.
   *
   * @returns Completion of the client's shutdown.
   */
  onModuleDestroy(): Promise<void> {
    return this.client.close();
  }
}
