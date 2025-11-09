import { Factory } from "@mikro-orm/seeder";

import dayjs from "dayjs";

import { VerificationRequest } from "@/common/entities/verification-requests.entity";
import {
  EVerificationRequestStatus,
  EVerificationRequestType,
} from "@/common/enums/verification-requests.enums";
import { RESET_PASSWORD_TOKEN_EXPIRATION_DURATION_IN_MINUTES } from "@/modules/auth/auth.constants";
import { generateSecureHex } from "@/utils/crypto-helper";

export class VerificationRequestFactory extends Factory<VerificationRequest> {
  model = VerificationRequest;

  definition(): Partial<VerificationRequest> {
    return {
      type: EVerificationRequestType.RESET_PASSWORD,
      status: EVerificationRequestStatus.ACTIVE,
      expiresAt: dayjs().add(RESET_PASSWORD_TOKEN_EXPIRATION_DURATION_IN_MINUTES, "days").toDate(),
      token: generateSecureHex(60),
    };
  }
}
