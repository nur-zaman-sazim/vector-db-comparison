import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";

import { User } from "@/common/entities/users.entity";

export const findUserByEmailOrFail = async (
  dbService: EntityManager<IDatabaseDriver<Connection>>,
  email: string,
) => {
  const user = await dbService.findOneOrFail(
    User,
    {
      email,
    },
    { populate: ["userProfile"] },
  );

  return user;
};
