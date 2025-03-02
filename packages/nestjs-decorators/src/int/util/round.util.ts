import { RoundingPolicy } from '../enum';

export function round(value: number, rounding: RoundingPolicy): number {
  switch (rounding) {
    case RoundingPolicy.CEIL:
      return Math.ceil(value);
    case RoundingPolicy.FLOOR:
      return Math.floor(value);
    default:
      return Math.round(value);
  }
}
