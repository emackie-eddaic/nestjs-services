import { TransformOptions } from 'class-transformer';
import { RoundingPolicy } from '../enum';

export interface TransformIntOptions extends TransformOptions {
  /**
   * Iterate over each option if value is an array.
   */
  each?: boolean;
  /**
   * Rounding policy applied to encountered decimal numbers. If not
   * specified, no rounding policy is used, and decimals will be
   * returned as null.
   */
  rounding?: RoundingPolicy;
}
