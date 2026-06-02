import {IsEmail, IsEnum, IsNotEmpty, IsString} from "class-validator";
import {Role} from "@prisma/client";

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username: string

  @IsEmail()
  email: string

  @IsString()
  @IsNotEmpty()
  password: string

  @IsEnum(Role)
  @IsNotEmpty()
  role: Role
}
