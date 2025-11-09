import { ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";

import { MikroORM } from "@mikro-orm/postgresql";

import { mockDeep } from "vitest-mock-extended";

import { AppModule } from "@/app.module";
import { S3Service } from "@/common/aws/s3-service/s3-service";
import ormConfig from "@/db/db.config";
import { DocumentSigningService } from "@/modules/document-signing/document-signing.service";
import { IEmailService } from "@/modules/emails/email-service.interface";
import { EMAIL_SERVICE_TOKEN } from "@/modules/emails/emails.constants";
import { FileUploadsService } from "@/modules/file-uploads/file-uploads.service";
import { PdfGenerationService } from "@/modules/pdf-generation/pdf-generation.service";

export const bootstrapTestServer = async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(S3Service)
    .useValue(mockDeep<S3Service>({ funcPropSupport: true }))
    .overrideProvider(FileUploadsService)
    .useValue(mockDeep<FileUploadsService>({ funcPropSupport: true }))
    .overrideProvider(PdfGenerationService)
    .useValue(mockDeep<PdfGenerationService>({ funcPropSupport: true }))
    .overrideProvider(DocumentSigningService)
    .useValue(mockDeep<DocumentSigningService>({ funcPropSupport: true }))
    .overrideProvider(EMAIL_SERVICE_TOKEN)
    .useValue(mockDeep<IEmailService>({ funcPropSupport: true }))
    .compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  const httpServer = app.getHttpServer();
  const orm = await MikroORM.init(ormConfig);
  const entityManager = orm.em.fork();
  await app.init();

  return {
    appInstance: app,
    httpServerInstance: httpServer,
    dbServiceInstance: entityManager,
    ormInstance: orm,
  };
};
