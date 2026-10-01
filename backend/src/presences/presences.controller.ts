import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import type { Profile } from "../auth/profile.js";
import { Roles } from "../auth/roles.decorator.js";
import { RolesGuard } from "../auth/roles.guard.js";
import { AssignPresenceDto } from "./dto/assign-presence.dto.js";
import { PresencesService } from "./presences.service.js";

@Controller("presences")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PresencesController {
  constructor(private readonly presences: PresencesService) {}

  @Get()
  @Roles("coordinator")
  open() {
    return this.presences.open();
  }

  @Get("mine")
  @Roles("monitor")
  mine(@CurrentUser() user: Profile) {
    return this.presences.mine(user);
  }

  @Post()
  @Roles("coordinator")
  assign(@Body() body: AssignPresenceDto) {
    return this.presences.assign(body.roomId, body.monitorId, body.startedAt, body.leavesAt);
  }

  @Patch(":id/close")
  @Roles("coordinator", "monitor")
  close(@Param("id") id: string, @CurrentUser() user: Profile) {
    return this.presences.close(id, user);
  }
}
