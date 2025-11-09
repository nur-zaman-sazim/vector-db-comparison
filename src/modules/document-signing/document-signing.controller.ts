import {
  Body,
  Controller,
  Post,
  UseInterceptors,
  UseGuards,
  HttpStatus,
  HttpCode,
} from "@nestjs/common";

import { ResponseTransformInterceptor } from "@/common/interceptors/response-transform.interceptor";
import { JwtAuthGuard } from "@/modules/auth/guards/jwt-auth.guard";

import { DocumentSigningService } from "./document-signing.service";
import { TDocusealWebhookPayload } from "./document-signing.types";

@UseInterceptors(ResponseTransformInterceptor)
@UseGuards(JwtAuthGuard)
@Controller("document-signing")
export class DocumentSigningController {
  constructor(private readonly documentSigningService: DocumentSigningService) {}

  @Post("webhook")
  @HttpCode(HttpStatus.OK)
  handleWebhook(@Body() payload: TDocusealWebhookPayload) {
    return this.documentSigningService.handleWebhook(payload);
  }
}
