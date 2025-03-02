import { tryBigInt } from './big-int.util';

describe('tryBigInt', () => {
  it('should return true if able to construct the bigint', () => {
    expect(tryBigInt(1)).toEqual(true);
  });
  it('should return false if unable to construct the bigint', () => {
    expect(tryBigInt('test')).toEqual(false);
  });
});
