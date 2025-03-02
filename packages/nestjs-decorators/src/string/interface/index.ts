import { TransformOptions } from 'class-transformer';

export interface SplitStringTransformOptions extends TransformOptions {
  separator?: string | RegExp;
  limit?: number;
}
