import { splitString } from './split-string.transformer';

describe('splitString', () => {
  it('should the passed value if not a string', () => {
    const value = null;
    expect(splitString(value)).toEqual(value);
  });

  it('should the passed value if not a string', () => {
    const value = undefined;
    expect(splitString(value)).toEqual(value);
  });

  it('should the passed value if not a string', () => {
    const value = 1234;
    expect(splitString(value)).toEqual(value);
  });

  it('should split one value', () => {
    const value = '';
    expect(splitString(value)).toEqual(['']);
  });

  it('should split one value', () => {
    const value = '1';
    expect(splitString(value)).toEqual(['1']);
  });

  it('should split two values', () => {
    const value = '1, 2';
    expect(splitString(value)).toEqual(['1', ' 2']);
  });
});
