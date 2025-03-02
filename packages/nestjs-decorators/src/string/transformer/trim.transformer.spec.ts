import { trim } from './trim.transformer';

describe('trim', () => {
  it('should return the trimmed value', () => {
    const value = '  test   ';
    expect(trim(value)).toEqual('test');
  });

  it('should return null if a number', () => {
    const value = 123;
    expect(trim(value)).toBeNull();
  });

  it('should return null if an object', () => {
    const value = {};
    expect(trim(value)).toBeNull();
  });
});
