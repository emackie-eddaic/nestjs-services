export type ThingsBoardHttpIntegrationConfiguration = {
  /**
   * ThingsBoard Cloud URL. Defaults to `https://thingsboard.cloud`
   */
  baseUrl?: string;
  /**
   * ThingsBoard HTTP Integration ID. API calls will fail if blank.
   */
  integrationId?: string;
};
