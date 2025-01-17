import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { MODULE_OPTIONS_TOKEN } from './things-board-http-integration.module-definition';
import {
  ThingsBoardHttpIntegrationBody,
  ThingsBoardHttpIntegrationConfiguration,
} from './type';

@Injectable()
export class ThingsBoardHttpIntegrationService {
  constructor(
    @Inject(MODULE_OPTIONS_TOKEN)
    private readonly config: ThingsBoardHttpIntegrationConfiguration,
    private readonly http: HttpService,
  ) {}

  /**
   * Uploads telemetry to the ThingsBoard Cloud using default url
   * `https://thingsboard.cloud` if `baseUrl` is not configured.
   *
   * If `integrationId` is not configured this call will fail.
   * @param body
   */
  async upload(body: ThingsBoardHttpIntegrationBody): Promise<void> {
    const { baseUrl = 'https://thingsboard.cloud', integrationId = '' } =
      this.config;
    if (integrationId) {
      const observable = this.http.post(
        `${baseUrl}/api/v1/integrations/http/${integrationId}`,
        body,
      );
      await firstValueFrom(observable);
    } else {
      throw new Error('`integrationId` not set.');
    }
  }
}
