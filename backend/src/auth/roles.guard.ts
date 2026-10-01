import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Profile } from "./profile.js";
import { ROLES_KEY } from "./roles.decorator.js";
import type { AppRole } from "./profile.js";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<AppRole[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!roles || roles.length === 0) return true;
    const request = context.switchToHttp().getRequest<{ user: Profile }>();
    return roles.includes(request.user.role);
  }
}
