import { Body, Controller, Get, Headers, Post, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import { CurrentUser } from "./current-user.decorator.js";
import { LoginDto } from "./dto/login.dto.js";
import { RefreshDto } from "./dto/refresh.dto.js";
import { JwtAuthGuard } from "./jwt-auth.guard.js";
import type { Profile } from "./profile.js";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("login")
  login(@Body() body: LoginDto) {
    return this.auth.login(body.email, body.password);
  }

  @Post("refresh")
  refresh(@Body() body: RefreshDto) {
    return this.auth.refresh(body.refreshToken);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: Profile) {
    return user;
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  async logout(@Headers("authorization") authorization: string) {
    await this.auth.logout(authorization.slice("Bearer ".length));
    return { ok: true };
  }
}
