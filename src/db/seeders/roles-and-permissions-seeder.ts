import type { EntityManager } from "@mikro-orm/core";
import { Seeder } from "@mikro-orm/seeder";

import { Permission } from "@/common/entities/permissions.entity";
import { Role } from "@/common/entities/roles.entity";
import { EPermission, EUserRole } from "@/common/enums/roles.enums";

export class RolesAndPermissionsSeeder extends Seeder {
  private readonly rolesToPermissionsMap: Record<EUserRole, EPermission[]> = {
    [EUserRole.SUPER_USER]: [
      EPermission.CREATE_USER,
      EPermission.DELETE_USER,
      EPermission.READ_USER,
      EPermission.UPDATE_USER,
    ],

    [EUserRole.ADMIN]: [EPermission.CREATE_USER, EPermission.READ_USER, EPermission.UPDATE_USER],
  };

  async run(em: EntityManager) {
    const roles = this.createRoles(em);
    this.createRolePermissions(em, roles);

    await em.flush();
  }

  createRoles(em: EntityManager) {
    const roles: Role[] = [];

    for (const role of Object.values(EUserRole)) {
      roles.push(new Role(role));
    }

    em.persist(roles);

    return roles;
  }

  createRolePermissions(em: EntityManager, roles: Role[]) {
    for (const role of roles) {
      const permissions = this.rolesToPermissionsMap[role.name].map(
        (permissionName) => new Permission(permissionName),
      );

      role.permissions.add(permissions);

      em.persist(permissions);
      em.persist(role);
    }
  }
}
