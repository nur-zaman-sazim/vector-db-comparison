import { createParamDecorator, ExecutionContext } from "@nestjs/common";

import { User } from "@/common/entities/users.entity";

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): User => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
