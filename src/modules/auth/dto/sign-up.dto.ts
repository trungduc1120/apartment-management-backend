import {IsEmail, IsNotEmpty, IsString} from "class-validator"

export class SignUpDto{
  @IsString()
  @IsNotEmpty()
  username: string

  @IsEmail()
  email: string

  @IsNotEmpty()
  password: string
}