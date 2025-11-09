import { Factory } from "@mikro-orm/seeder";

import { faker } from "@faker-js/faker";

import { UserProfile } from "@/common/entities/user-profiles.entity";
import { User } from "@/common/entities/users.entity";

export class UserFactory extends Factory<User> {
  model = User;

  definition(): Partial<User> {
    return {
      email: faker.internet.email(),
      password: faker.internet.password(),
    };
  }
}

export class UserProfileFactory extends Factory<UserProfile> {
  model = UserProfile;

  definition(): Partial<UserProfile> {
    return {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
    };
  }
}
