import { Entity, PrimaryKey, ManyToOne, Rel, Enum, Property } from "@mikro-orm/core";

import { EOAuthProvider } from "../enums/shared.enums";
import { CustomBaseEntity } from "./custom-base.entity";
import { User } from "./users.entity";

@Entity({
  tableName: "user_oauths",
})
export class UserOAuth extends CustomBaseEntity {
  constructor(sub: string, provider: EOAuthProvider, providerVerifiedEmail: boolean) {
    super();

    this.sub = sub;
    this.provider = provider;
    this.providerVerifiedEmail = providerVerifiedEmail;
  }

  @PrimaryKey({ type: "uuid", defaultRaw: "gen_random_uuid()" })
  id!: string;

  @Property({ fieldName: "sub" })
  sub!: string;

  @Enum(() => EOAuthProvider)
  provider!: EOAuthProvider;

  @Property({ fieldName: "provider_verified_email" })
  providerVerifiedEmail!: boolean;

  @ManyToOne(() => User)
  user!: Rel<User>;
}
