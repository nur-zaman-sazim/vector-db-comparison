import { BadRequestException } from "@nestjs/common";

import {
  Entity,
  OneToOne,
  PrimaryKey,
  Property,
  Rel,
  ManyToOne,
  EntityRepositoryType,
} from "@mikro-orm/core";

import { UserProfilesRepository } from "@/modules/user-profiles/user-profiles.repository";

import { CustomBaseEntity } from "./custom-base.entity";
import { Role } from "./roles.entity";
import { User } from "./users.entity";

@Entity({
  tableName: "user_profiles",
  repository: () => UserProfilesRepository,
})
export class UserProfile extends CustomBaseEntity {
  [EntityRepositoryType]?: UserProfilesRepository;

  constructor(firstName: string, lastName: string) {
    super();

    this.firstName = firstName;
    this.lastName = lastName;
  }

  @PrimaryKey({ autoincrement: true })
  id!: number;

  @Property({ fieldName: "first_name" })
  firstName!: string;

  @Property({ fieldName: "last_name" })
  lastName!: string;

  @Property({ persist: false })
  get email(): string {
    if (!this.user) {
      throw new BadRequestException("User not properly defined");
    }
    return this.user.email;
  }

  @OneToOne(() => User, { hidden: true })
  user!: Rel<User>;

  @ManyToOne(() => Role)
  role!: Rel<Role>;
}
