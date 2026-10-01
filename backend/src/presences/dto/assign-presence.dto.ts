import { IsISO8601, IsString, IsUUID, MinLength } from "class-validator";

export class AssignPresenceDto {
  @IsString()
  @MinLength(1)
  roomId!: string;

  @IsUUID()
  monitorId!: string;

  @IsISO8601()
  startedAt!: string;

  @IsISO8601()
  leavesAt!: string;
}
