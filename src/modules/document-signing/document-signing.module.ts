import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";

import { FileUploadsModule } from "@/modules/file-uploads/file-uploads.module";

import { DocumentSigningController } from "./document-signing.controller";
import { DocumentSigningService } from "./document-signing.service";

@Module({
  imports: [FileUploadsModule, HttpModule],
  providers: [DocumentSigningService],
  controllers: [DocumentSigningController],
  exports: [DocumentSigningService],
})
export class DocumentSigningModule {}
