import {
  Collection,
  Entity,
  EntityRepositoryType,
  Enum,
  OneToMany,
  OneToOne,
  PrimaryKey,
  Property,
  Rel,
} from "@mikro-orm/core";

import { UsersRepository } from "@/modules/users/users.repository";

import { EUserState } from "../enums/users.enums";
import { CustomBaseEntity } from "./custom-base.entity";
import { UserProfile } from "./user-profiles.entity";
import { VerificationRequest } from "./verification-requests.entity";

@Entity({
  tableName: "users",
  repository: () => UsersRepository,
})
export class User extends CustomBaseEntity {
  [EntityRepositoryType]?: UsersRepository;

  constructor(email: string, password?: string) {
    super();

    this.email = email;
    this.password = password;
  }

  @PrimaryKey({ autoincrement: true })
  id!: number;

  @Property({ unique: true })
  email!: string;

  @Property({ nullable: true })
  password?: string | null;

  @Enum({ items: () => EUserState, fieldName: "state" })
  state: EUserState = EUserState.ACTIVE;

  @Property({ fieldName: "verified_at", nullable: true })
  verifiedAt?: Date | null;

  @Property({ fieldName: "first_login_at", nullable: true })
  firstLoginAt?: Date | null;

  @OneToOne(() => UserProfile, { mappedBy: (userProfile) => userProfile.user })
  userProfile!: Rel<UserProfile>;

  @OneToMany(() => VerificationRequest, (verificationRequest) => verificationRequest.user, {
    nullable: true,
  })
  verificationRequests = new Collection<VerificationRequest>(this);
}
