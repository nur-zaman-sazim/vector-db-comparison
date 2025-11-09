import type { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";

import { Permission } from "@/common/entities/permissions.entity";
import { Role } from "@/common/entities/roles.entity";
import { EPermission, EUserRole } from "@/common/enums/roles.enums";

export const seedPermissionsData = async (
  dbService: EntityManager<IDatabaseDriver<Connection>>,
): Promise<void> => {
  const adminRole = new Role(EUserRole.ADMIN);
  const superUserRole = new Role(EUserRole.SUPER_USER);

  const createPermission = new Permission(EPermission.CREATE_USER);
  const readPermission = new Permission(EPermission.READ_USER);
  const updatePermission = new Permission(EPermission.UPDATE_USER);
  const deletePermission = new Permission(EPermission.DELETE_USER);

  adminRole.permissions.add(createPermission);
  adminRole.permissions.add(readPermission);
  adminRole.permissions.add(updatePermission);

  superUserRole.permissions.add(createPermission);
  superUserRole.permissions.add(readPermission);
  superUserRole.permissions.add(updatePermission);
  superUserRole.permissions.add(deletePermission);

  await dbService.persistAndFlush([
    adminRole,
    superUserRole,
    createPermission,
    readPermission,
    updatePermission,
    deletePermission,
  ]);
};
