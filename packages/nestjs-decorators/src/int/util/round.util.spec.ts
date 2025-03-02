import { RoundingPolicy } from '../enum';
import { round } from './round.util';

describe('round', () => {
  it('should return 1 if the value is 1.5 and RoundingPolicy.FLOOR', () => {
    expect(round(1.5, RoundingPolicy.FLOOR)).toEqual(1);
  });
  it('should return 2 if the value is 1.5 and RoundingPolicy.CEIL', () => {
    expect(round(1.5, RoundingPolicy.CEIL)).toEqual(2);
  });
  it('should return 2 if the value is 1.5 and RoundingPolicy.DEFAULT', () => {
    expect(round(1.5, RoundingPolicy.DEFAULT)).toEqual(2);
  });
});
