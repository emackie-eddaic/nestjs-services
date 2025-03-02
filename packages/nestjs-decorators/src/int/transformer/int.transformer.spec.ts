import { RoundingPolicy } from '../enum';
import { transformInt, transformIntArray } from './int.transformer';

describe('transformInt', () => {
  it('should return the value if int string', () => {
    expect(transformInt('1234')).toEqual(1234);
  });
  it('should return the value if int', () => {
    expect(transformInt(1234)).toEqual(1234);
  });
  it('should return the value if string 0', () => {
    expect(transformInt('0')).toEqual(0);
  });
  it('should return the value if 0', () => {
    expect(transformInt(0)).toEqual(0);
  });
  it('should return null if the string value has decimals', () => {
    expect(transformInt('0.5')).toEqual(null);
  });
  it('should return null if the value has decimals', () => {
    expect(transformInt(0.5)).toEqual(null);
  });
  it('should return 0 if the value has decimals and rounding policy', () => {
    expect(transformInt(0.5, { rounding: RoundingPolicy.DEFAULT })).toEqual(1);
  });
  it('should return null if the value is not a number', () => {
    expect(transformInt('test')).toEqual(null);
  });
  it('should return null if the value is empty', () => {
    expect(transformInt('')).toEqual(null);
  });
  it('should return null if the value is NaN', () => {
    expect(transformInt(NaN)).toEqual(null);
  });
  it('should return null if the value is an object', () => {
    expect(transformInt({})).toEqual(null);
  });
  it('should return null if the value is undefined', () => {
    expect(transformInt(undefined)).toEqual(null);
  });
  it('should return null if the value is null', () => {
    expect(transformInt(null)).toEqual(null);
  });
});

describe('transformIntArray', () => {
  it('should return the value if int string', () => {
    expect(transformIntArray(['1234'])).toEqual([1234]);
  });
  it('should return the value if int', () => {
    expect(transformIntArray([1234])).toEqual([1234]);
  });
  it('should return nulls if mixed values', () => {
    expect(transformIntArray([1234, null, 'dasd'])).toEqual([1234, null, null]);
  });
  it('should return the value if string 0', () => {
    expect(transformIntArray(['0'])).toEqual([0]);
  });
  it('should return the value if 0', () => {
    expect(transformIntArray([0])).toEqual([0]);
  });
  it('should return null if the string value has decimals', () => {
    expect(transformIntArray(['0.5'])).toEqual([null]);
  });
  it('should return null if the value has decimals', () => {
    expect(transformIntArray([0.5])).toEqual([null]);
  });
  it('should return 0 if the value has decimals and rounding policy', () => {
    expect(
      transformIntArray([0.5, 0.4], { rounding: RoundingPolicy.DEFAULT }),
    ).toEqual([1, 0]);
  });
  it('should return null if the value is not a number', () => {
    expect(transformIntArray(['test'])).toEqual([null]);
  });
  it('should return null if the value is empty', () => {
    expect(transformIntArray([''])).toEqual([null]);
  });
  it('should return null if the value is NaN', () => {
    expect(transformIntArray([NaN])).toEqual([null]);
  });
  it('should return null if the value is an object', () => {
    expect(transformIntArray([{}])).toEqual([null]);
  });
  it('should return null if the value is undefined', () => {
    expect(transformIntArray([undefined])).toEqual([null]);
  });
  it('should return null if the value is null', () => {
    expect(transformIntArray([null])).toEqual([null]);
  });
});
