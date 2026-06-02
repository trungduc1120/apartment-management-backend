// dto/update-account.dto.ts
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';


export class UpdateAccountDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  username?: string;

  // 🔐 đổi mật khẩu
  @IsOptional()
  @IsString()
  oldPassword?: string;

  @IsOptional()
  @IsString()
  newPassword?: string;
}
