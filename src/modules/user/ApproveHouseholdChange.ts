import {InformationStatus} from "@prisma/client";
import {IsEnum, IsOptional, IsString} from "class-validator";

export class ApproveHouseholdChangeDto {
  @IsEnum(InformationStatus)
  state: InformationStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}
