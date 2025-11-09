import {
  Collection,
  Entity,
  EntityRepositoryType,
  Enum,
  ManyToMany,
  PrimaryKey,
} from "@mikro-orm/core";

import { PermissionsRepository } from "@/permissions/permissions.repository";

import { EPermission } from "../enums/roles.enums";
import { CustomBaseEntity } from "./custom-base.entity";
import { Role } from "./roles.entity";

@Entity({
  tableName: "permissions",
  repository: () => PermissionsRepository,
})
export class Permission extends CustomBaseEntity {
  [EntityRepositoryType]?: PermissionsRepository;

  constructor(name: EPermission) {
    super();
    this.name = name;
  }

  @PrimaryKey({ autoincrement: true })
  id!: number;

  @Enum(() => EPermission)
  name!: EPermission;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles = new Collection<Role>(this);
}
