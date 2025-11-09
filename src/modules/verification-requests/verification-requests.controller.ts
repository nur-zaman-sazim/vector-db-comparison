import {
  UseInterceptors,
  Controller,
  Post,
  Param,
  ParseEnumPipe,
  Query,
  Get,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";

import { EVerificationRequestType } from "@/common/enums/verification-requests.enums";
import { ResponseTransformInterceptor } from "@/common/interceptors/response-transform.interceptor";

import { VerificationRequestResponse, VerifyByTokenResponse } from "./verification-requests.dtos";
import { VerificationRequestsSerializer } from "./verification-requests.serializer";
import { VerificationRequestsService } from "./verification-requests.service";

@UseInterceptors(ResponseTransformInterceptor)
@Controller("verification-requests")
export class VerificationRequestsController {
  constructor(
    private readonly verificationRequestsService: VerificationRequestsService,
    private readonly verificationRequestsSerializer: VerificationRequestsSerializer,
  ) {}

  @Post("verify/:token")
  @HttpCode(HttpStatus.OK)
  async verify(
    @Param("token") token: string,
    @Query("type", new ParseEnumPipe(EVerificationRequestType))
    type: EVerificationRequestType,
  ): Promise<VerifyByTokenResponse> {
    await this.verificationRequestsService.verifyByTokenAndType(token, type);

    return { message: "Verification successful" };
  }

  @Get(":token")
  async findOneVerificationRequest(
    @Param("token") token: string,
    @Query("type", new ParseEnumPipe(EVerificationRequestType)) type: EVerificationRequestType,
  ): Promise<VerificationRequestResponse> {
    const verificationRequest = await this.verificationRequestsService.findOneByTokenAndTypeOrFail(
      token,
      type,
    );

    return this.verificationRequestsSerializer.serialize(verificationRequest);
  }
}
