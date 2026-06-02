import { IsArray, IsDateString, IsNumber } from 'class-validator';

export class CreateFeeAssignmentDto {
  @IsNumber()
  feeId: number;

  @IsArray()
  householdIds: number[];

  @IsDateString()
  dueDate: string;
}