import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import {HouseHoldStatus, InformationStatus} from '@prisma/client';
import {Type} from "class-transformer";

export class CreateHouseHoldDto {
  @IsNumber()
  @IsNotEmpty()
  houseHoldCode: number; // số hộ khẩu

  @IsString()
  @IsNotEmpty()
  apartmentNumber: string; // số căn hộ

  @IsString()
  @IsOptional()
  buildingNumber: string; // số nhà

  @IsString()
  @IsNotEmpty()
  street: string;

  @IsString()
  @IsNotEmpty()
  ward: string; // Xã/Phường (bắt buộc)

  @IsString()
  @IsNotEmpty()
  province: string; // Tỉnh/Thành

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  headID?: number;

  @IsEnum(InformationStatus)
  @IsOptional()
  informationStatus?: InformationStatus

  @IsNumber()
  @IsOptional()
  numCars?: number

  @IsNumber()
  @IsOptional()
  numMotorbike?: number
}
