import { RoundingPolicy } from '../enum';
import { transformBigInt } from './big-int.transformer';

describe('transformBigInt', () => {
  it('should return the value if bigint', () => {
    expect(transformBigInt('922337203685477580')).toEqual(922337203685477580n);
  });
  it('should return the value if bigint', () => {
    expect(transformBigInt(922337203685477580n)).toEqual(922337203685477580n);
  });
  it('should return the value if 0', () => {
    expect(transformBigInt(0)).toEqual(0n);
  });
  it('should return null if the string value has decimals', () => {
    expect(transformBigInt('0.5')).toEqual(null);
  });
  it('should return null if the value has decimals', () => {
    expect(transformBigInt(0.5)).toEqual(null);
  });
  it('should return 1 if the value has decimals and rounding policy', () => {
    expect(transformBigInt(0.5, { rounding: RoundingPolicy.DEFAULT })).toEqual(
      1n,
    );
  });
  it('should return null if the value is not a number', () => {
    expect(transformBigInt('test')).toEqual(null);
  });
  it('should return null if the value is empty', () => {
    expect(transformBigInt('')).toEqual(null);
  });
  it('should return null if the value is NaN', () => {
    expect(transformBigInt(NaN)).toEqual(null);
  });
  it('should return null if the value is an object', () => {
    expect(transformBigInt({})).toEqual(null);
  });
  it('should return null if the value is null', () => {
    expect(transformBigInt(null)).toEqual(null);
  });
  it('should return null if the value is undefined', () => {
    expect(transformBigInt(undefined)).toEqual(null);
  });
});
