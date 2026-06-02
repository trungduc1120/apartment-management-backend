import { IsNotEmpty, IsString} from 'class-validator';
export class RejectPaymentDto {
    @IsString()
    @IsNotEmpty()
    note: string;
}
