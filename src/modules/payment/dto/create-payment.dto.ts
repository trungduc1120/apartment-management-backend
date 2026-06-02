import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsNumber()
  @IsNotEmpty()
  feeAssignmentId: number;

  @IsNumber()
  @Min(0) 
  @IsNotEmpty()
  amountPaid: number;

  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @IsString()
  @IsNotEmpty()
  imagePath: string;
}