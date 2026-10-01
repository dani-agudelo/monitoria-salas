import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import type { Profile } from "../auth/profile.js";
import { Roles } from "../auth/roles.decorator.js";
import { RolesGuard } from "../auth/roles.guard.js";
import { CreateObservationDto } from "./dto/create-observation.dto.js";
import { ObservationsService } from "./observations.service.js";

@Controller("observations")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ObservationsController {
  constructor(private readonly observations: ObservationsService) {}

  @Get()
  @Roles("coordinator")
  list() {
    return this.observations.list();
  }

  @Post()
  @Roles("monitor")
  create(@CurrentUser() user: Profile, @Body() body: CreateObservationDto) {
    return this.observations.create(user, body.presenceId, body.body);
  }
}
