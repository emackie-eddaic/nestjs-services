import { toLower } from './to-lower.transformer';

describe('toLower', () => {
  it('should return the lower cased value', () => {
    const value = 'TesT';
    expect(toLower(value)).toEqual('test');
  });

  it('should return null if a number', () => {
    const value = 123;
    expect(toLower(value)).toBeNull();
  });

  it('should return null if an object', () => {
    const value = {};
    expect(toLower(value)).toBeNull();
  });
});
