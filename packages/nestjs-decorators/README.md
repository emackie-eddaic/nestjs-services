# nestjs-decorators

A variety of decorators, pipes and transformers intended for use with [NestJS](https://nestjs.com/) framework.

Included with each decorator are Swagger `ApiProperty` definitions to reduce boilerplate in DTOs.

## Compatibility

Supports NestJS 11 and 12 in CommonJS and ESM applications. Published JavaScript is CommonJS with TypeScript declarations; ESM applications can use named imports. NestJS 12 requires Node.js 20.19+ (22.12+ on Node 22); Node.js 24 is recommended.

Use `@nestjs/swagger` 11 with NestJS 11, or `@nestjs/swagger` 12 with NestJS 12.
Supports `class-validator` versions `^0.14.3` and `^0.15.1`.

## Installation

```sh
npm install @eddaic/nestjs-decorators
```

## Decorators

- `ApiPropertyBigInt`
- `ApiPropertyBigIntOptional`
- `ApiPropertyDate`
- `ApiPropertyDateOptional`
- `ApiPropertyInt`
- `ApiPropertyIntOptional`
- `IsBigInt`
- `ParseBigIntPipe`
- `SplitString`
- `ToBoolean`
- `ToLower`
- `TransformBigInt`
- `TransformInt`
- `Trim`

## Examples

### `ParseBigIntPipe`

Pipe parameters as bigint values and serialize them as strings in responses. A `BadRequestException` is thrown if unable to transform.

```typescript
import { ParseBigIntPipe } from '@eddaic/nestjs-decorators';
import { Controller, Get, Param } from '@nestjs/common';

@Controller()
export class AppController {
  @Get(':id')
  getId(@Param('id', ParseBigIntPipe) id: bigint): string {
    return id.toString();
  }
}
```

### `ApiPropertyBigInt`, `ApiPropertyBigIntOptional`, `IsBigInt`, `TransformBigInt`

Validate `bigint` values or transform decimal values to `bigint` through a rounding policy.

```typescript
import {
  ApiPropertyBigInt,
  ApiPropertyBigIntOptional,
  IsBigInt,
  RoundingPolicy,
  TransformBigInt,
} from '@eddaic/nestjs-decorators';
import { IsOptional } from 'class-validator';

export class MyDto {
  @IsBigInt()
  @ApiPropertyBigInt()
  id!: bigint;

  @IsBigInt()
  @IsOptional()
  @ApiPropertyBigIntOptional()
  limit?: bigint;

  @IsBigInt()
  @TransformBigInt({ rounding: RoundingPolicy.CEIL })
  @ApiPropertyBigInt()
  ceil!: bigint;
}
```

### `ApiPropertyInt`, `TransformInt`

Transform numbers or nonblank numeric strings to safe integer `number` values. Decimal values require a rounding policy. Invalid inputs, non-finite values, and results outside JavaScript's safe integer range return `null`. Booleans, objects, arrays passed as scalar values, and bigint inputs return `null`. Use `TransformBigInt` for large integer strings.

```typescript
import {
  ApiPropertyInt,
  RoundingPolicy,
  TransformInt,
} from '@eddaic/nestjs-decorators';
import { IsNumber } from 'class-validator';

export class MyDto {
  @IsNumber()
  @TransformInt({ rounding: RoundingPolicy.FLOOR })
  @ApiPropertyInt()
  floor!: number;
}
```

#### Transforming Arrays

```typescript
import {
  ApiPropertyInt,
  RoundingPolicy,
  TransformInt,
} from '@eddaic/nestjs-decorators';
import { IsNumber } from 'class-validator';

export class MyDto {
  @IsNumber({}, { each: true })
  @TransformInt({ each: true, rounding: RoundingPolicy.FLOOR })
  @ApiPropertyInt({ isArray: true })
  floors!: number[];
}
```

### `ApiPropertyDate`, `ApiPropertyDateOptional`

```typescript
import {
  ApiPropertyDate,
  ApiPropertyDateOptional,
} from '@eddaic/nestjs-decorators';
import { IsDate, IsOptional } from 'class-validator';

export class MyDto {
  @IsDate()
  @ApiPropertyDate()
  date!: Date;

  @IsDate()
  @IsOptional()
  @ApiPropertyDateOptional()
  optional_date?: Date;
}
```

### `SplitString`

Returns string array using specified separator (defaults to `,`). Supporting `RegExp` also.

```typescript
import { SplitString } from '@eddaic/nestjs-decorators';
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class MyDto {
  @IsString({ each: true })
  @SplitString({ separator: '|' })
  @ApiProperty({ isArray: true, type: 'string' })
  strings!: string[];
}
```

#### Combined with `TransformInt`

```typescript
import {
  ApiPropertyInt,
  SplitString,
  TransformInt,
} from '@eddaic/nestjs-decorators';
import { IsNumber } from 'class-validator';

export class MyDto {
  @IsNumber({}, { each: true })
  @SplitString({ separator: ',' })
  @TransformInt({ each: true })
  @ApiPropertyInt({ isArray: true })
  integers!: number[];
}
```

### `Trim`

```typescript
import { Trim } from '@eddaic/nestjs-decorators';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class MyDto {
  @IsString()
  @IsNotEmpty()
  @Trim()
  @ApiProperty()
  nonEmptyString!: string;
}
```
