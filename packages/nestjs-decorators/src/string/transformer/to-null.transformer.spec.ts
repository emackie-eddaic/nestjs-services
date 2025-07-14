import { toNull } from './to-null.transformer';

describe('toLower', () => {
  it('should return null value', () => {
    expect(toNull(null)).toEqual(null);
    expect(toNull('null')).toEqual(null);
    expect(toNull('NULL')).toEqual(null);
    expect(toNull('test')).toEqual('test');
    expect(toNull(1)).toEqual(1);
  });
});
