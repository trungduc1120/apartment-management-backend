import { IsString, IsEmail, IsEnum, IsDateString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';
import {Gender, InformationStatus, RelationshipToHead, ResidenceStatus} from '@prisma/client';

export class CreateResidentDto {
  @IsString()
  @IsNotEmpty()
  nationalId: string; // cccd, unique

  @IsString()
  @IsNotEmpty()
  phoneNumber: string; // unique

  @IsEmail()
  @IsNotEmpty()
  email: string; // unique

  @IsString()
  @IsNotEmpty()
  fullname: string;

  @IsDateString()
  @IsNotEmpty()
  dateOfBirth: string;

  @IsEnum(Gender)
  @IsNotEmpty()
  gender: Gender;

  @IsEnum(RelationshipToHead)
  @IsNotEmpty()
  relationshipToHead: RelationshipToHead;

  @IsString()
  @IsNotEmpty()
  placeOfOrigin: string;

  @IsString()
  @IsNotEmpty()
  occupation: string;

  @IsString()
  @IsOptional()
  workingAdress: string;

  @IsInt()
  @IsOptional()
  houseHoldId?: number; // relation, optional

  @IsEnum(ResidenceStatus)
  @IsOptional()
  residentStatus?: ResidenceStatus

  @IsEnum(InformationStatus)
  @IsOptional()
  informationStatus?: InformationStatus

  @IsOptional()
  updateReason?: string
}
