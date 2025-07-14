import { toBoolean } from './to-boolean.transformer';

describe('splitString', () => {
  it('should return boolean if boolean', () => {
    expect(toBoolean(true)).toEqual(true);
    expect(toBoolean(false)).toEqual(false);
  });

  it('should return boolean for strings', () => {
    expect(toBoolean('true')).toEqual(true);
    expect(toBoolean('false')).toEqual(false);
    expect(toBoolean('0')).toEqual(false);
    expect(toBoolean('')).toEqual(false);
    expect(toBoolean('1')).toEqual(true);
  });

  it('should return boolean for number', () => {
    expect(toBoolean(1)).toEqual(true);
    expect(toBoolean(0.5)).toEqual(true);
    expect(toBoolean(0)).toEqual(false);
    expect(toBoolean(-1)).toEqual(true);
  });

  it('should return boolean for bigint', () => {
    expect(toBoolean(1n)).toEqual(true);
    expect(toBoolean(0n)).toEqual(false);
    expect(toBoolean(-1n)).toEqual(true);
  });

  it('should return true for object', () => {
    expect(toBoolean({})).toEqual(true);
    expect(toBoolean({ prop: 2 })).toEqual(true);
  });

  it('should return false for other', () => {
    expect(toBoolean(undefined)).toEqual(false);
    expect(toBoolean(null)).toEqual(false);
  });
});
