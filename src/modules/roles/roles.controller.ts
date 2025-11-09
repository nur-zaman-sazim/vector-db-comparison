import { Body, Controller, Get, Patch, UseGuards, UseInterceptors } from "@nestjs/common";

import { EUserRole } from "@/common/enums/roles.enums";
import { ResponseTransformInterceptor } from "@/common/interceptors/response-transform.interceptor";

import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import {
  RoleResponse,
  RolesWithUsersAndPermissionsResponse,
  UpdateRolesPermissionsDto,
} from "./roles.dtos";
import { RolesSerializer } from "./roles.serializer";
import { RolesService } from "./roles.service";

@UseInterceptors(ResponseTransformInterceptor)
@UseGuards(JwtAuthGuard)
@Controller("roles")
export class RolesController {
  constructor(
    private readonly rolesService: RolesService,
    private readonly rolesSerializer: RolesSerializer,
  ) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(EUserRole.SUPER_USER)
  async getAllRoles(): Promise<RoleResponse[]> {
    const roles = await this.rolesService.findAll();
    return this.rolesSerializer.serializeMany(roles);
  }

  @UseGuards(RolesGuard)
  @Roles(EUserRole.ADMIN, EUserRole.SUPER_USER)
  @Get("users-permissions")
  async getRolesUserCountPermissions(): Promise<RolesWithUsersAndPermissionsResponse> {
    const roles_permissions = await this.rolesService.rolesWithUsersAndPermissions();
    return roles_permissions;
  }

  @UseGuards(RolesGuard)
  @Roles(EUserRole.ADMIN, EUserRole.SUPER_USER)
  @Patch("update-permissions")
  async updateRolesPermissions(@Body() updateRolesPermissionsDto: UpdateRolesPermissionsDto) {
    const rolesPermissions = await this.rolesService.updateRolesPermissions(
      updateRolesPermissionsDto.roleId,
      updateRolesPermissionsDto.permissionsToRemoveIds,
      updateRolesPermissionsDto.permissionsToAddIds,
    );
    return rolesPermissions;
  }
}
