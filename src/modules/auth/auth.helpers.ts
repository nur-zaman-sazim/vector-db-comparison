import { User } from "@/common/entities/users.entity";
import { ITokenizedUser } from "@/modules/auth/auth.interfaces";

export function makeTokenizedUser(user: User): ITokenizedUser {
  return {
    id: user.id,
    claim: user.userProfile.role.name,
    email: user.email,
    claimId: user.userProfile.role.id,
    userProfileId: user.userProfile.id,
  };
}
