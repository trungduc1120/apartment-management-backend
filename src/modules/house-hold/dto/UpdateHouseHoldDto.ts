import { PartialType } from '@nestjs/mapped-types';
import {IsEnum, IsOptional, IsString} from "class-validator";
import {InformationStatus} from "@prisma/client";
import {CreateHouseHoldDto} from "./create-house-hold.dto";

export class UpdateHouseHoldDto extends PartialType(CreateHouseHoldDto) {
  @IsString()
  @IsOptional()
  updateReason?: string;
}
