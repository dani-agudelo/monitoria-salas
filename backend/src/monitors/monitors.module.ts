import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { MonitorsController } from "./monitors.controller.js";
import { MonitorsService } from "./monitors.service.js";

@Module({
  imports: [AuthModule],
  controllers: [MonitorsController],
  providers: [MonitorsService],
})
export class MonitorsModule {}