import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { User } from "@/common/entities/users.entity";
import { EPermission } from "@/common/enums/roles.enums";
import { RolesService } from "@/modules/roles/roles.service";

import { PERMISSIONS_KEY } from "../decorators/permissions.decorator";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector, private readonly rolesService: RolesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<EPermission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as User;
    const userRoleDescription = await this.rolesService.findByIdOrThrow(user.userProfile.role.id);
    const userPermissions = userRoleDescription.permissions.map(
      (rolePermission) => rolePermission.name,
    );

    return requiredPermissions.every((requiredPermission) =>
      userPermissions.includes(requiredPermission),
    );
  }
}
