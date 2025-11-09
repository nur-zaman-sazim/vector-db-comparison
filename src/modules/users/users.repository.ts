import { Injectable } from "@nestjs/common";

import { EntityManager, QueryOrder, wrap } from "@mikro-orm/core";

import { Role } from "@/common/entities/roles.entity";
import { UserOAuth } from "@/common/entities/user-oauths.entity";
import { UserProfile } from "@/common/entities/user-profiles.entity";
import { EOAuthProvider } from "@/common/enums/shared.enums";
import { CustomSQLBaseRepository } from "@/common/repository/custom-sql-base.repository";

import { User } from "../../common/entities/users.entity";
import { ISignInWithGoogleParams } from "../auth/auth.interfaces";
import {
  UpdateUserAsSuperuserDto,
  RegisterUserDto,
  SelfRegisterUserDto,
  UpdateUserDto,
  SuperuserFindAllUsersParams,
} from "./users.dtos";

@Injectable()
export class UsersRepository extends CustomSQLBaseRepository<User> {
  createOne(registerUserDto: RegisterUserDto | SelfRegisterUserDto, role: Role) {
    const {
      email,
      password,
      userProfile: { firstName, lastName },
    } = registerUserDto;

    const user = new User(email, password);
    const userProfile = new UserProfile(firstName, lastName);

    userProfile.role = role;
    user.userProfile = userProfile;
    userProfile.user = user;

    this.em.persist([user, userProfile]);

    return user;
  }

  update(user: User, updateUserDto: UpdateUserDto) {
    this.em.assign(user, updateUserDto);

    this.em.persist(user);

    return user;
  }

  updateAsSuperuser(
    user: User,
    updateUserAsSuperuserDto: UpdateUserAsSuperuserDto,
    updatedRole?: Role,
  ) {
    const { roleId: _, ...rest } = updateUserAsSuperuserDto;

    this.em.assign(user, rest);

    if (updatedRole) {
      user.userProfile.role = updatedRole;
    }

    this.em.persist(user);

    return user;
  }

  findAllPaginated(params: SuperuserFindAllUsersParams, currentUserId: number) {
    const { page, limit, state } = params;

    const qb = this.createQueryBuilder("u")
      .select("*")
      .leftJoinAndSelect("u.userProfile", "up")
      .leftJoinAndSelect("up.role", "r")
      .where({
        state,
        id: {
          $ne: currentUserId,
        },
      })
      .orderBy({
        createdAt: QueryOrder.DESC,
      });

    return this.retrievePaginatedRecordsByLimitAndOffset({ qb, page, limit });
  }

  createWithOAuthProvider(
    input: ISignInWithGoogleParams,
    provider: EOAuthProvider,
    role: Role,
    em?: EntityManager,
  ) {
    const entityManager = em ?? this.em;

    const newUser = new User(input.user.email);

    const newUserProfile = new UserProfile(input.user.firstName, input.user.lastName);
    wrap(newUserProfile).assign({ user: newUser, role });

    const userOAuth = new UserOAuth(input.user.sub, provider, input.user.isVerified);
    wrap(userOAuth).assign({ user: newUser });

    entityManager.persist([newUser, newUserProfile, userOAuth]);

    return newUser;
  }
}
