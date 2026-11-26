import {
  Client,
  ElevationResponseData,
  GeocodeResult,
  GeolocateResponseData,
  Place,
  PositionalElevationParams,
  RequestParams,
  SampledPathElevationParams,
  TimeZoneResponseData,
} from '@googlemaps/google-maps-services-js';
import { Inject, Injectable } from '@nestjs/common';
import { MODULE_OPTIONS_TOKEN } from './google-maps.module-definition';
import type {
  GeolocateRequestData,
  GoogleMapsConfiguration,
  PlaceDetailsRequestParams,
  ReverseGeocodeParams,
  TimezoneParams,
} from './type';

/**
 * Configures the official Google Maps Services JS client and exposes API helpers.
 *
 * @see {@link https://github.com/googlemaps/google-maps-services-js | Google Maps Services JS}
 */
@Injectable()
export class GoogleMapsService {
  /** The configured official client for direct API calls. */
  readonly client: Client;
  /** Shared authentication parameters merged into convenience-method requests. */
  readonly params: RequestParams;

  /**
   * Creates the client using configuration supplied by `GoogleMapsModule`.
   *
   * @param configuration - Shared API credentials and client options.
   */
  constructor(
    @Inject(MODULE_OPTIONS_TOKEN) configuration: GoogleMapsConfiguration,
  ) {
    const { config, params } = configuration;
    this.params = params;
    this.client = new Client(config);
  }

  /**
   * Looks up elevations for individual locations or samples along a path.
   *
   * @deprecated This helper will be removed in the next major release. Use
   * `client.elevation` directly and supply the shared authentication parameters
   * from `params` in the request.
   *
   * @param params - Locations to look up, or a path and its sample count.
   * @returns The Elevation API response data, including elevation results.
   */
  async elevation(
    params: PositionalElevationParams | SampledPathElevationParams,
  ): Promise<ElevationResponseData> {
    const { data } = await this.client.elevation({
      params: { ...this.params, ...params },
    });
    return data;
  }

  /**
   * Estimates a location from cell-tower and Wi-Fi access-point observations.
   *
   * @remarks
   * Set `considerIp` to `false` unless the server's location is intended:
   * IP-based lookup uses the server's IP address.
   *
   * @deprecated This helper will be removed in the next major release. Use
   * `client.geolocate` directly and supply the shared authentication parameters
   * from `params` in the request.
   *
   * @param data - Device observations and IP-fallback settings.
   * @returns The estimated coordinates and accuracy radius in meters.
   */
  async geolocate(data: GeolocateRequestData): Promise<GeolocateResponseData> {
    const { data: responseData } = await this.client.geolocate({
      params: this.params,
      data,
    });
    return responseData as GeolocateResponseData;
  }

  /**
   * Retrieves place details through Places API (Legacy).
   *
   * @deprecated This helper will be removed in the next major release in favor
   * of a new NestJS wrapper library for Google's official `@googlemaps/places`
   * client and Places API (New). The replacement wrapper is planned and is not
   * yet available. This helper requires legacy Places access; enabling Places
   * API (New) does not enable it.
   *
   * @param params - Place ID, requested fields, and other legacy Places options.
   * @returns The legacy place details result.
   */
  async placeDetails(params: PlaceDetailsRequestParams): Promise<Place> {
    const { data } = await this.client.placeDetails({
      params: { ...this.params, ...params },
    });
    return data.result;
  }

  /**
   * Retrieves addresses for coordinates or a place ID using the Geocoding API.
   *
   * @deprecated This helper will be removed in the next major release. Use
   * `client.reverseGeocode` directly and supply the shared authentication parameters
   * from `params` in the request.
   *
   * @param params - Location or place ID, language, and result filters.
   * @returns Matching geocoding results, or an empty array when none are found.
   */
  async reverseGeocode(params: ReverseGeocodeParams): Promise<GeocodeResult[]> {
    const { data } = await this.client.reverseGeocode({
      params: { ...this.params, ...params },
    });
    return data.results;
  }

  /**
   * Reverse geocodes a location and retrieves legacy details for the first place.
   *
   * @remarks
   * Makes two separately billed requests: Geocoding and Places API (Legacy).
   *
   * @deprecated This helper will be removed in the next major release in favor
   * of a new NestJS wrapper library for Google's official `@googlemaps/places`
   * client. The replacement wrapper is planned and is not yet available. Use
   * `client.reverseGeocode` directly for addresses;
   * future place-details calls should use Places API (New).
   *
   * @param params - Location or place ID and reverse-geocoding filters.
   * @returns Legacy place details for the first geocoding result.
   * @throws An error with message `No places returned` when geocoding finds no results.
   */
  async reverseGeocodeAsPlace(params: ReverseGeocodeParams): Promise<Place> {
    const results = await this.reverseGeocode(params);
    if (results.length > 0) {
      return this.placeDetails({ place_id: results[0].place_id });
    } else {
      throw new Error('No places returned');
    }
  }

  /**
   * Retrieves time-zone information for a location at a specified time.
   *
   * @deprecated This helper will be removed in the next major release. Use
   * `client.timezone` directly and supply the shared authentication parameters
   * from `params` in the request.
   *
   * @param params - Coordinates, timestamp, and optional response language.
   * @returns Time-zone identifiers and offsets for standard time and daylight saving.
   */
  async timezone(params: TimezoneParams): Promise<TimeZoneResponseData> {
    const { data } = await this.client.timezone({
      params: { ...this.params, ...params },
    });
    return data;
  }
}
