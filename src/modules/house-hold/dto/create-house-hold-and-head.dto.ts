import { CreateHouseHoldDto } from './create-house-hold.dto';
import {CreateResidentDto} from "./create-resident.dto";
import {Type} from "class-transformer";
import {ValidateNested} from "class-validator";

export class CreateHouseHoldAndHeadDto {
  @Type(() => CreateResidentDto)
  @ValidateNested()
  resident: CreateResidentDto;
  @Type(() => CreateHouseHoldDto)
  @ValidateNested()
  household: CreateHouseHoldDto;
}