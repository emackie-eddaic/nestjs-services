import { isBigInt } from './big-int.validator';

describe('isBigInt', () => {
  it('should return true if bigint maximum', () => {
    expect(isBigInt(922337203685477580n)).toEqual(true);
  });
  it('should return true if bigint minimum', () => {
    expect(isBigInt(-922337203685477580n)).toEqual(true);
  });
  it('should return true if bigint maximum as string', () => {
    expect(isBigInt('922337203685477580')).toEqual(true);
  });
  it('should return true if bigint minimum as string', () => {
    expect(isBigInt('-922337203685477580')).toEqual(true);
  });
  it('should return true if 0', () => {
    expect(isBigInt(0)).toEqual(true);
  });
  it('should return true if 0n', () => {
    expect(isBigInt(0n)).toEqual(true);
  });
  it('should return true if 1', () => {
    expect(isBigInt(1)).toEqual(true);
  });
  it('should return true if 1n', () => {
    expect(isBigInt(1n)).toEqual(true);
  });
  it('should return false if string number has decimals', () => {
    expect(isBigInt('0.43654')).toEqual(false);
  });
  it('should return false if number has decimals', () => {
    expect(isBigInt(0.43654)).toEqual(false);
  });
  it('should return false if not numeric', () => {
    expect(isBigInt('test')).toEqual(false);
  });
  it('should return false if empty', () => {
    expect(isBigInt('')).toEqual(false);
  });
  it('should return false if NaN', () => {
    expect(isBigInt(NaN)).toEqual(false);
  });
  it('should return false if object', () => {
    expect(isBigInt({})).toEqual(false);
  });
  it('should return false if null', () => {
    expect(isBigInt(null)).toEqual(false);
  });
  it('should return false if undefined', () => {
    expect(isBigInt(undefined)).toEqual(false);
  });
});
