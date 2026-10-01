import { Type } from "class-transformer";
import { IsArray, IsInt, IsOptional, IsString, Min, MinLength } from "class-validator";

export class SaveRoomDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(1)
  locationId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity!: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];
}
