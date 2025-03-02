# nestjs-decorators

A variety of decorators, pipes and transformers intended for use with [NestJS](https://nestjs.com/) framework.

Included with each decorator are Swagger `ApiProperty` definitions to reduce boiler plate in DTOs.

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
- `TransformBigInt`
- `TransformInt`
- `Trim`

## Examples

### `ParseBigIntPipe`

Pipe parameters as bigint values, raising `BadRequestException` if unable to tranform.

```typescript
import { ParseBigIntPipe } from '@eddaic/nestjs-decorators';
import { Controller, Get, Param } from '@nestjs/common';

@Controller()
export class AppController {
  @Get(':id')
  async getId(@Param('id', ParseBigIntPipe) id: bigint): bigint {
    return id;
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
import { IsNumber, IsOptional } from 'class-validator';

export class MyDto {
  @IsBigInt()
  @ApiPropertyBigInt()
  id: bigint;

  @IsBigInt()
  @IsOptional()
  @ApiPropertyBigIntOptional()
  limit?: bigint;

  @IsNumber()
  @TransformBigInt({ rounding: RoundingPolicy.CEIL })
  @ApiPropertyBigInt()
  ceil: bigint;
}
```

### `ApiPropertyInt`, `TransformInt`

Transform decimal values to integer `number` values through a rounding policy.

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
  floor: number;
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
  @IsNumber({ each: true })
  @TransformInt({ each: true, rounding: RoundingPolicy.FLOOR })
  @ApiPropertyInt({ isArray: true })
  floors: number[];
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
  date: date;

  @IsDate()
  @IsOptional()
  @ApiPropertyDateOptional()
  optional_date?: date;
}
```

### `SplitString`

Returns string array using specified separator (defaults to `,`). Supporting `RegExp` also.

```typescript
import { SplitString } from '@eddaic/nestjs-decorators';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class MyDto {
  @IsString({ each: true })
  @SplitString({ separator: '|' })
  @ApiProperty({ isArray: true, type: 'string' })
  strings: string[];
}
```

#### Combined with `TransformInt`

```typescript
import { SplitString, TransformInt } from '@eddaic/nestjs-decorators';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class MyDto {
  @IsNumber({ each: true })
  @SplitString({ separator: ',' })
  @TransformInt({ each: true })
  @ApiPropertyInt({ isArray: true })
  integers: number[];
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
  nonEmptyString: string;
}
```
