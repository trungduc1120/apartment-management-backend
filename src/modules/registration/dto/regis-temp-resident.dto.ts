import {CreateResidentDto} from "../../house-hold/dto/create-resident.dto";
import {Type} from "class-transformer";
import {IsDateString, IsEnum, IsNumber, IsOptional, IsString, ValidateNested} from "class-validator";
import {InformationStatus} from "@prisma/client";

export class RegisTempResidentDto{
  @Type(() => CreateResidentDto)
  @ValidateNested()
  resident: CreateResidentDto;

  @IsDateString()
  startDate:         string;

  @IsDateString()
  @IsOptional()
  endDate:           string;

  @IsString()
  reason:            string;

  @IsNumber()
  submittedUserId:   number;

  @IsNumber()
  @IsOptional()
  reviewedAdminId? :  number;

  @IsString()
  @IsOptional()
  reviewedAt?   :     string;
}