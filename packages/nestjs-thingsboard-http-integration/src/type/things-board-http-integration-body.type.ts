type GenericValues = Record<
  string,
  boolean | number | string | object | undefined
>;

export type ThingsBoardHttpIntegrationBody = {
  /**
   * Device name uniquely identifies device in ThingsBoard.
   */
  deviceName: string;
  /**
   * Device type, also known as Device Profile in ThingsBoard.
   */
  deviceType: string;
  /**
   * Attributes to set for the device. Can be anything, but will
   * be set only once for the device.
   */
  attributes?: GenericValues;
  telemetry: {
    /**
     * Timestamp in milliseconds since midnight, January 1, 1970 UTC.
     */
    ts: number;
    /**
     * Values to pass as telemetry
     */
    values: GenericValues;
  };
};
