import {IsEnum, IsNotEmpty, IsNumber} from "class-validator";
import {Role} from "@prisma/client";

export class UpdateUserRoleDto{
  @IsEnum(Role, {message: 'Role is not exist'})
  @IsNotEmpty()
  role: Role
}