import {IsEnum, IsOptional, IsString, IsNumber, IsBoolean, IsDateString} from 'class-validator';
import {FeeCalculationBase, Frequency} from '@prisma/client';
import { Transform, Type } from 'class-transformer';

export class CreateFeeDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    return value === 'true';
  })
  @IsBoolean()
  isMandatory: boolean

  @IsEnum(Frequency)
  frequency: Frequency;

  @Transform(({ value }) => Number(value))
  @IsOptional()
  @IsNumber()
  rate?: number;

  @IsOptional()
  @IsEnum(FeeCalculationBase)
  calculationBase?: FeeCalculationBase;

  @IsNumber()
  @IsOptional()
  anchorDay?: number;

  @IsNumber()
  @IsOptional()
  anchorMonth?: number;
}
