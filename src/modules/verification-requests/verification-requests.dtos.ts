import { ApiProperty } from "@nestjs/swagger";

import {
  EVerificationRequestStatus,
  EVerificationRequestType,
} from "@/common/enums/verification-requests.enums";

export class VerifyByTokenResponse {
  message!: string;
}

export class VerificationRequestResponse {
  id!: number;

  createdAt!: Date;

  updatedAt!: Date;

  token!: string;

  @ApiProperty({ enum: EVerificationRequestStatus, enumName: "EVerificationRequestStatus" })
  status!: EVerificationRequestStatus;

  @ApiProperty({ enum: EVerificationRequestType, enumName: "EVerificationRequestType" })
  type!: EVerificationRequestType;

  user!: { id: number };
}
