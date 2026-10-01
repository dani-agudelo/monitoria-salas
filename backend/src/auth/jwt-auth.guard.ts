import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Profile } from "./profile.js";
import { AuthService } from "./auth.service.js";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: Profile;
    }>();
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Falta el token de sesión.");
    }
    request.user = await this.auth.profileFromAccessToken(header.slice("Bearer ".length));
    return true;
  }
}
