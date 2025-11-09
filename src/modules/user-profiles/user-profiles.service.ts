import { Injectable } from "@nestjs/common";

import { EntityManager } from "@mikro-orm/postgresql";

import { UpdateUserProfileDto } from "./user-profiles.dtos";
import { UserProfilesRepository } from "./user-profiles.repository";

@Injectable()
export class UserProfilesService {
  constructor(
    private readonly userProfilesRepository: UserProfilesRepository,
    private readonly em: EntityManager,
  ) {}

  async updateUserProfile(userId: number, body: UpdateUserProfileDto) {
    const userProfile = await this.userProfilesRepository.findOneOrFail(
      {
        user: {
          id: userId,
        },
      },
      {
        populate: ["user"],
      },
    );

    this.em.assign(userProfile, body);

    await this.em.flush();

    return userProfile;
  }

  getUserProfile(userId: number) {
    return this.userProfilesRepository.findOneOrFail(
      {
        user: {
          id: userId,
        },
      },
      {
        populate: ["role"],
      },
    );
  }
}
