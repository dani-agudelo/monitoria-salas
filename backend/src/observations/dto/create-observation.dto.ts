import { IsString, IsUUID, MinLength } from "class-validator";

export class CreateObservationDto {
  @IsUUID()
  presenceId!: string;

  @IsString()
  @MinLength(1)
  body!: string;
}
