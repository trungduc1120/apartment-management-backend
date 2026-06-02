import {CreateResidentDto} from "../../house-hold/dto/create-resident.dto";
import {Type} from "class-transformer";
import {IsDateString, IsEnum, IsNumber, IsOptional, IsString, ValidateNested} from "class-validator";
import {InformationStatus} from "@prisma/client";

export class RegisTempAbsentDto{
  @IsNumber()
  residentId: number;

  @IsDateString()
  startDate:         string;

  @IsDateString()
  @IsOptional()
  endDate:           string;

  @IsString()
  reason:            string;

  @IsString()
  destination:       string // Nơi đến tạm vắng

  @IsNumber()
  @IsOptional()
  reviewedAdminId? :  number;

  @IsString()
  @IsOptional()
  reviewedAt?   :     string;
}