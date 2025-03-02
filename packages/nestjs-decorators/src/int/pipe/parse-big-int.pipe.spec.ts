import { ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ParseBigIntPipe } from './parse-big-int.pipe';

describe('ParseBigIntPipe', () => {
  let pipe: ParseBigIntPipe;

  beforeEach(async () => {
    pipe = new ParseBigIntPipe();
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  describe('transform', () => {
    it('should return the value if bigint', () => {
      const value = '922337203685477580';
      const metadata: ArgumentMetadata = {
        type: 'body',
      };
      expect(pipe.transform(value, metadata)).toBe(BigInt(value));
    });

    it('should throw BadRequestException if value is not a bigint', () => {
      const value = 'test';
      const metadata: ArgumentMetadata = {
        type: 'body',
        data: 'test',
      };
      expect(() => {
        pipe.transform(value, metadata);
      }).toThrow(BadRequestException);
    });
  });
});
