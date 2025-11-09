import type { EntityManager } from "@mikro-orm/core";
import { Seeder } from "@mikro-orm/seeder";

import * as argon2 from "argon2";

import { ARGON2_OPTIONS } from "@/common/config/argon2.config";
import { Role } from "@/common/entities/roles.entity";
import { UserProfile } from "@/common/entities/user-profiles.entity";
import { User } from "@/common/entities/users.entity";
import { EUserRole } from "@/common/enums/roles.enums";

export class CreateTestUser extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const email = "test@test.app";
    const hashedPassword = await argon2.hash("test123", ARGON2_OPTIONS);

    const user = new User(email, hashedPassword);

    const userProfile = new UserProfile("Test", "User");
    const superUserRole = await em.findOneOrFail(Role, { name: EUserRole.SUPER_USER });

    userProfile.user = user;
    userProfile.role = superUserRole;
    user.userProfile = userProfile;

    em.persist(user);

    const secondEmail = "test2@test.app";
    const secondHashedPassword = await argon2.hash("test123", ARGON2_OPTIONS);

    const secondUser = new User(secondEmail, secondHashedPassword);

    const secondUserProfile = new UserProfile("Test", "User");

    secondUserProfile.user = secondUser;
    secondUserProfile.role = superUserRole;
    secondUser.userProfile = secondUserProfile;

    em.persist(secondUser);

    await em.flush();
  }
}
