import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { Profile } from "./profile.js";

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Profile => {
    const request = context.switchToHttp().getRequest<{ user: Profile }>();
    return request.user;
  },
);
