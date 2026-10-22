import { plainToInstance } from 'class-transformer';
import { RoundingPolicy } from '../enum';
import {
  TransformInt,
  transformInt,
  transformIntArray,
} from './int.transformer';

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
  it('should round decimals using the default rounding policy', () => {
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
  it('should round decimals using the default rounding policy', () => {
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

describe('transformInt input validation', () => {
  describe.each([
    undefined,
    RoundingPolicy.DEFAULT,
    RoundingPolicy.CEIL,
    RoundingPolicy.FLOOR,
  ])('with rounding policy %p', (rounding) => {
    it.each([
      'not-a-number',
      '   ',
      '\t\n',
      NaN,
      Infinity,
      -Infinity,
      'Infinity',
      true,
      false,
      [],
      [123],
      {},
      123n,
      Symbol('invalid'),
      Number.MAX_SAFE_INTEGER + 1,
      Number.MIN_SAFE_INTEGER - 1,
      '9007199254740993',
      '-9007199254740993',
    ])('returns null for invalid input %p', (value) => {
      expect(transformInt(value, { rounding })).toBeNull();
    });

    it.each([
      Number.MAX_SAFE_INTEGER,
      Number.MIN_SAFE_INTEGER,
      String(Number.MAX_SAFE_INTEGER),
      String(Number.MIN_SAFE_INTEGER),
      ' 123 ',
      '-123',
    ])('accepts a safe numeric input %p', (value) => {
      expect(transformInt(value, { rounding })).toBe(Number(value));
    });
  });

  it('does not invoke object coercion hooks', () => {
    const value = {
      valueOf: jest.fn(() => {
        throw new Error('Must not coerce objects');
      }),
    };
    expect(
      transformInt(value, { rounding: RoundingPolicy.DEFAULT }),
    ).toBeNull();
    expect(value.valueOf).not.toHaveBeenCalled();
  });

  it.each([
    [RoundingPolicy.DEFAULT, 1.5, 2],
    [RoundingPolicy.CEIL, 1.5, 2],
    [RoundingPolicy.FLOOR, 1.5, 1],
    [RoundingPolicy.DEFAULT, -1.5, -1],
    [RoundingPolicy.CEIL, -1.5, -1],
    [RoundingPolicy.FLOOR, -1.5, -2],
  ])('applies policy %p to %p', (rounding, value, expected) => {
    expect(transformInt(value, { rounding })).toBe(expected);
    expect(transformInt(String(value), { rounding })).toBe(expected);
  });

  it('validates array elements independently when rounding', () => {
    expect(
      transformIntArray(
        ['1.5', 'bad', Infinity, true, [], '9007199254740993', '-2.5'],
        { rounding: RoundingPolicy.FLOOR },
      ),
    ).toEqual([1, null, null, null, null, null, -3]);
  });
});

describe('TransformInt', () => {
  class TestDto {
    @TransformInt({ rounding: RoundingPolicy.CEIL })
    scalar!: number | null;

    @TransformInt({ each: true, rounding: RoundingPolicy.FLOOR })
    values!: Array<number | null>;
  }

  it('applies input validation and rounding through class-transformer', () => {
    const dto = plainToInstance(TestDto, {
      scalar: 'invalid',
      values: ['2.9', true, ' ', Infinity, '9007199254740993', '-1.1'],
    });

    expect(dto.scalar).toBeNull();
    expect(dto.values).toEqual([2, null, null, null, null, -2]);
  });

  it('rounds a valid scalar through class-transformer', () => {
    expect(plainToInstance(TestDto, { scalar: '1.2' }).scalar).toBe(2);
  });
});
