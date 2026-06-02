import {CreateResidentDto} from "../../house-hold/dto/create-resident.dto";
import {Type} from "class-transformer";
import {IsDateString, IsEnum, IsNumber, IsOptional, IsString, ValidateNested} from "class-validator";
import {InformationStatus} from "@prisma/client";
import {PartialType} from "@nestjs/mapped-types";

export class UpdateResidentDto extends PartialType(CreateResidentDto) {}
export class RegisTempAndUpdateDto{
  @Type(() => UpdateResidentDto)
  @ValidateNested()
  resident: UpdateResidentDto;

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