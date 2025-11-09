import { Injectable } from "@nestjs/common";

import { Permission } from "@/common/entities/permissions.entity";
import { EUserRole } from "@/common/enums/roles.enums";
import { EUserState } from "@/common/enums/users.enums";
import { PermissionsRepository } from "@/permissions/permissions.repository";

import { UserProfilesRepository } from "../user-profiles/user-profiles.repository";
import { RolesWithUsersCount } from "./roles.dtos";
import { RolesRepository } from "./roles.repository";

@Injectable()
export class RolesService {
  constructor(
    private readonly rolesRepository: RolesRepository,
    private readonly userProfilesRepository: UserProfilesRepository,
    private readonly permissionsRepository: PermissionsRepository,
  ) {}

  findByIdOrThrow(id: number) {
    return this.rolesRepository.findOneOrFail(id, {
      populate: ["permissions"],
    });
  }

  findAll() {
    return this.rolesRepository.findAll();
  }

  async rolesWithUsersAndPermissions() {
    const roles = await this.rolesRepository.findAll({
      populate: ["permissions"],
    });

    const userProfiles = await this.userProfilesRepository.findAll({
      populate: ["user"],
    });

    const permissions: Permission[] = await this.permissionsRepository.findAll();

    const rolesWithUsersCount: RolesWithUsersCount[] = [];

    roles.forEach((role) => {
      if (role.name === EUserRole.SUPER_USER) return;
      let activeUsersCount = 0;
      let inactiveUsersCount = 0;
      for (const userProfile of userProfiles) {
        if (userProfile.role.id === role.id) {
          if (userProfile.user.state === EUserState.ACTIVE) activeUsersCount++;
          else if (userProfile.user.state === EUserState.INACTIVE) inactiveUsersCount++;
        }
      }

      rolesWithUsersCount.push({
        role,
        activeUsersCount,
        inactiveUsersCount,
      });
    });

    return { roles: rolesWithUsersCount, permissions };
  }

  async updateRolesPermissions(
    id: number,
    permissionsToRemoveIds: number[],
    permissionsToAddIds: number[],
  ) {
    const role = await this.rolesRepository.findOneOrFail(id, {
      populate: ["permissions.id"],
    });

    const rolePermissions = role.permissions.filter(
      (permission) => !permissionsToRemoveIds.includes(permission.id),
    );

    const permissionsToAdd = await this.permissionsRepository.find({
      id: { $in: permissionsToAddIds },
    });

    const updatedRolePermissions = [...rolePermissions, ...permissionsToAdd];

    role.permissions.set(updatedRolePermissions);

    await this.rolesRepository.getEntityManager().persistAndFlush(role);

    return role;
  }
}
