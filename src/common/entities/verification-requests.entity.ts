import {
  Entity,
  EntityRepositoryType,
  Enum,
  ManyToOne,
  PrimaryKey,
  Property,
  Rel,
} from "@mikro-orm/core";

import { VerificationRequestsRepository } from "@/modules/verification-requests/verification-requests.repository";

import {
  EVerificationRequestStatus,
  EVerificationRequestType,
} from "../enums/verification-requests.enums";
import { CustomBaseEntity } from "./custom-base.entity";
import { User } from "./users.entity";

@Entity({
  tableName: "verification_requests",
  repository: () => VerificationRequestsRepository,
})
export class VerificationRequest extends CustomBaseEntity {
  [EntityRepositoryType]?: VerificationRequestsRepository;

  @PrimaryKey({ autoincrement: true })
  id!: number;

  @Property({ unique: true })
  token!: string;

  @Property({ fieldName: "expires_at" })
  expiresAt!: Date;

  @Property({ name: "isExpired", persist: false, hidden: true })
  isExpired() {
    return this.expiresAt < new Date(new Date().toUTCString());
  }

  @Enum({ items: () => EVerificationRequestStatus, fieldName: "status" })
  status: EVerificationRequestStatus = EVerificationRequestStatus.ACTIVE;

  @Enum({ items: () => EVerificationRequestType, fieldName: "type" })
  type!: EVerificationRequestType;

  @ManyToOne(() => User, {
    fieldName: "user_id",
    nullable: true,
  })
  user?: Rel<User>;
}
