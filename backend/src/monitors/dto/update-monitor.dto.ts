import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class UpdateMonitorDto {
  @IsString()
  @MinLength(1)
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
