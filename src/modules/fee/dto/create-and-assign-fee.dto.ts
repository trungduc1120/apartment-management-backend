import {CreateFeeAssignmentDto} from "./create-assignment.dto";
import {CreateFeeDto} from "./create-fee.dto";
import {IsDateString} from "class-validator";

export class CreateAndAssignFeeDto extends CreateFeeDto {
  @IsDateString()
  dueDate: string;
}