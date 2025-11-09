import { Body, Controller, Post, UseInterceptors } from "@nestjs/common";

import { ResponseTransformInterceptor } from "@/common/interceptors/response-transform.interceptor";
import {
  PresignedUrlFileDto,
  PresignedUrlResponse,
} from "@/modules/file-uploads/file-uploads.dtos";

import { FileUploadsService } from "./file-uploads.service";

@UseInterceptors(ResponseTransformInterceptor)
@Controller("file-uploads")
export class FileUploadsController {
  constructor(private readonly fileUploadsService: FileUploadsService) {}

  @Post()
  getPresignedUrl(@Body() fileUploadDto: PresignedUrlFileDto): Promise<PresignedUrlResponse[]> {
    return this.fileUploadsService.getPresignedUrl(fileUploadDto);
  }
}
