import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { Roles } from "../auth/roles.decorator.js";
import { RolesGuard } from "../auth/roles.guard.js";
import { CreateMonitorDto } from "./dto/create-monitor.dto.js";
import { UpdateMonitorDto } from "./dto/update-monitor.dto.js";
import { MonitorsService } from "./monitors.service.js";

@Controller("monitors")
@Roles("coordinator")
@UseGuards(JwtAuthGuard, RolesGuard)
export class MonitorsController {
  constructor(private readonly monitors: MonitorsService) {}

  @Get()
  list() {
    return this.monitors.list();
  }

  @Post()
  create(@Body() body: CreateMonitorDto) {
    return this.monitors.create(body.fullName, body.email, body.password);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: UpdateMonitorDto) {
    return this.monitors.update(id, body.fullName, body.email, body.password);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.monitors.remove(id);
  }
}
