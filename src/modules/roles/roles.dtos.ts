import { PermissionResponse } from "@/permissions/permissions.dtos";

export class RoleResponse {
  id!: number;
  createdAt!: Date;
  updatedAt!: Date;
  name!: string;
}

export class RolesWithUsersCount {
  role!: RoleResponse;
  activeUsersCount!: number;
  inactiveUsersCount!: number;
}

export class RolesWithUsersAndPermissionsResponse {
  roles!: RolesWithUsersCount[];
  permissions!: PermissionResponse[];
}

export class UpdateRolesPermissionsDto {
  roleId!: number;
  permissionsToRemoveIds!: number[];
  permissionsToAddIds!: number[];
}
