import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { Roles } from "../auth/roles.decorator.js";
import { RolesGuard } from "../auth/roles.guard.js";
import { SaveRoomDto } from "./dto/save-room.dto.js";
import { RoomsService } from "./rooms.service.js";

@Controller("rooms")
export class RoomsController {
  constructor(private readonly rooms: RoomsService) {}

  @Get("open")
  open() {
    return this.rooms.openRooms();
  }

  @Get("locations")
  locations() {
    return this.rooms.locations();
  }

  @Get("coverage")
  @Roles("coordinator")
  @UseGuards(JwtAuthGuard, RolesGuard)
  coverage() {
    return this.rooms.coverage();
  }

  @Get()
  @Roles("coordinator")
  @UseGuards(JwtAuthGuard, RolesGuard)
  list() {
    return this.rooms.list();
  }

  @Post()
  @Roles("coordinator")
  @UseGuards(JwtAuthGuard, RolesGuard)
  create(@Body() body: SaveRoomDto) {
    return this.rooms.create(body);
  }

  @Patch(":id")
  @Roles("coordinator")
  @UseGuards(JwtAuthGuard, RolesGuard)
  update(@Param("id") id: string, @Body() body: SaveRoomDto) {
    return this.rooms.update(id, body);
  }

  @Delete(":id")
  @Roles("coordinator")
  @UseGuards(JwtAuthGuard, RolesGuard)
  remove(@Param("id") id: string) {
    return this.rooms.remove(id);
  }
}
