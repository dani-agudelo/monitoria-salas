import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { PresencesController } from "./presences.controller.js";
import { PresencesService } from "./presences.service.js";

@Module({
  imports: [AuthModule],
  controllers: [PresencesController],
  providers: [PresencesService],
})
export class PresencesModule {}
