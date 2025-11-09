import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";

import * as argon2 from "argon2";

import { ARGON2_OPTIONS } from "@/common/config/argon2.config";
import { Role } from "@/common/entities/roles.entity";
import { EUserRole } from "@/common/enums/roles.enums";

import { MOCK_AUTH_EMAIL, MOCK_AUTH_PASS } from "../../auth/auth.mock";
import { UserFactory, UserProfileFactory } from "../factories/users.factory";

export const createUserInDb = async (
  dbService: EntityManager<IDatabaseDriver<Connection>>,
  config?: {
    email?: string;
    password?: string;
    role?: EUserRole;
  },
  shouldFlush = true,
) => {
  const defaultConfig = {
    email: MOCK_AUTH_EMAIL,
    password: MOCK_AUTH_PASS,
    role: EUserRole.ADMIN,
  };

  const password = config?.password || defaultConfig.password;
  const hashedPassword = await argon2.hash(password, ARGON2_OPTIONS);

  const values = {
    ...defaultConfig,
    ...config,
    password: hashedPassword,
  };
  const user = new UserFactory(dbService).makeOne({
    email: values.email,
    password: values.password,
  });
  const userProfile = new UserProfileFactory(dbService).makeOne();
  const role = await dbService.findOneOrFail(Role, { name: values.role });

  user.userProfile = userProfile;
  userProfile.user = user;
  userProfile.role = role;

  if (shouldFlush) {
    await dbService.flush();
  }

  return userProfile;
};
