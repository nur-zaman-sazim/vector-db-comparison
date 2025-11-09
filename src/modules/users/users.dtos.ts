import { OmitType, PartialType, PickType, ApiProperty } from "@nestjs/swagger";

import { Type } from "class-transformer";
import {
  IsEmail,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from "class-validator";

import { PaginatedResponse, PaginationArgsDto } from "@/common/dtos/pagination.dtos";
import { User } from "@/common/entities/users.entity";
import { EUserRole } from "@/common/enums/roles.enums";
import { EUserState } from "@/common/enums/users.enums";
import { ITokenizedUser } from "@/modules/auth/auth.interfaces";

import {
  SelfRegisterUserProfileDto,
  UserProfileDto,
  UserProfileResponse,
} from "../user-profiles/user-profiles.dtos";

export class RegisterUserDto implements Pick<User, "email" | "password"> {
  @IsString()
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password: string = process.env.DEFAULT_PASSWORD as string;

  @IsObject()
  @ValidateNested()
  @Type(() => UserProfileDto)
  userProfile!: UserProfileDto;
}

export class SelfRegisterUserDto extends OmitType(RegisterUserDto, ["userProfile"]) {
  @IsObject()
  @ValidateNested()
  @Type(() => SelfRegisterUserProfileDto)
  userProfile!: SelfRegisterUserProfileDto;
}

export class UpdateUserDto extends PickType(PartialType(RegisterUserDto), ["password"]) {}

export class UpdateUserAsSuperuserDto extends UpdateUserDto {
  @IsOptional()
  @IsEnum(EUserState)
  @ApiProperty({ enum: EUserState, enumName: "EUserState" })
  state?: EUserState;

  @IsOptional()
  @IsNumber()
  roleId?: number;
}

export class SuperuserFindAllUsersParams extends PaginationArgsDto {
  @ApiProperty({ enum: EUserState, enumName: "EUserState" })
  @IsOptional()
  @IsEnum(EUserState)
  state?: EUserState;
}

export class UserResponse {
  id!: number;
  email!: string;
  createdAt!: Date;
  updatedAt!: Date;
  userProfile!: UserProfileResponse;
}

export class SuperuserUserResponse extends UserResponse {
  @ApiProperty({ enum: EUserState, enumName: "EUserState" })
  state!: EUserState;
}

export class TokenizedUser implements ITokenizedUser {
  id!: number;

  claimId!: number;

  @ApiProperty({ enum: EUserRole, enumName: "EUserRole" })
  claim!: EUserRole;

  userProfileId!: number;

  email!: string;
}

export class SuperuserFindAllUserResponse extends PaginatedResponse {
  data!: SuperuserUserResponse[];
}
