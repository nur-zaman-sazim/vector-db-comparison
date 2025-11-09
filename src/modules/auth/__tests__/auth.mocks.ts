import { User } from "@/common/entities/users.entity";

import { SignInResponse } from "../auth.dtos";

export const MOCK_USER_ID = 1;
export const MOCK_USER_EMAIL = "user.test@email.com";
export const MOCK_USER_PASSWORD = "123456";
export const MOCK_JWT_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

export const getMockSignInResponse = (user: User): SignInResponse => ({
  accessToken: MOCK_JWT_TOKEN,
  user: {
    id: user.id,
    email: user.email,
    claim: user.userProfile.role.name,
    claimId: user.userProfile.role.id,
    userProfileId: user.userProfile.id,
  },
});
