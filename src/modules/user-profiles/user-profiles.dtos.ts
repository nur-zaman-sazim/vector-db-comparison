import { OmitType, PartialType } from "@nestjs/swagger";

import { Type } from "class-transformer";
import { IsString, MinLength, MaxLength } from "class-validator";

import { UserProfile } from "@/common/entities/user-profiles.entity";

import { RoleResponse } from "../roles/roles.dtos";

export class UserProfileDto implements Pick<UserProfile, "firstName" | "lastName"> {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  firstName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(255)
  lastName!: string;

  @Type(() => Number)
  roleId!: number;
}

export class SelfRegisterUserProfileDto extends OmitType(UserProfileDto, ["roleId"]) {}

export class UpdateUserProfileDto extends OmitType(PartialType(UserProfileDto), ["roleId"]) {}

export class UserProfileResponse {
  id!: number;
  createdAt!: Date;
  updatedAt!: Date;
  firstName!: string;
  lastName!: string;
  email!: string;
  role!: RoleResponse;
}
