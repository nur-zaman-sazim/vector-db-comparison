import { Module } from "@nestjs/common";

import { FileUploadsModule } from "@/modules/file-uploads/file-uploads.module";

import { PdfGenerationService } from "./pdf-generation.service";

@Module({
  imports: [FileUploadsModule],
  providers: [PdfGenerationService],
  exports: [PdfGenerationService],
})
export class PdfGenerationModule {}
