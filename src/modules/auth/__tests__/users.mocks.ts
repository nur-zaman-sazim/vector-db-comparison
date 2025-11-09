import { faker } from "@faker-js/faker";

import { Role } from "@/common/entities/roles.entity";
import { UserProfile } from "@/common/entities/user-profiles.entity";
import { User } from "@/common/entities/users.entity";
import { EUserRole } from "@/common/enums/roles.enums";

export const MOCK_USER = new User(
  "test.user.x@email.com",
  "$argon2i$v=19$m=16,t=2,p=1$MTIzNDU2Nzg$0UUB6E64WB9X/Tp5NC4DKw",
);
export const MOCK_USER_PROFILE = new UserProfile(faker.person.firstName(), faker.person.lastName());
export const MOCK_USER_ROLE = new Role(EUserRole.ADMIN);
MOCK_USER_ROLE.id = 1;

MOCK_USER.userProfile = MOCK_USER_PROFILE;
MOCK_USER_PROFILE.user = MOCK_USER;
MOCK_USER_PROFILE.role = MOCK_USER_ROLE;
