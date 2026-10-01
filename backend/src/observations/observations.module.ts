import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { ObservationsController } from "./observations.controller.js";
import { ObservationsService } from "./observations.service.js";

@Module({
  imports: [AuthModule],
  controllers: [ObservationsController],
  providers: [ObservationsService],
})
export class ObservationsModule {}