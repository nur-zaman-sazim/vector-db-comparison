import { Logger, ValidationPipe, VersioningType } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder, SwaggerDocumentOptions } from "@nestjs/swagger";

import helmet from "helmet";
import { WinstonModule } from "nest-winston";

import { AppModule } from "./app.module";
import { AuditLoggingSubscriber } from "./common/audit-logging/audit-logging.subscriber";
import { getAllowedMethods, getCorsConfig } from "./common/config/cors.config";
import { CustomBaseExceptionFilter } from "./common/filters/custom-base-exception.filter";
import { AuditLoggingSubscriberCreatorInterceptor } from "./common/interceptors/audit-logging-subscriber-creator.interceptor";
import getWinstonLoggerTransports from "./utils/logger";

async function bootstrap() {
  const logger = WinstonModule.createLogger({
    transports: getWinstonLoggerTransports(),
  });

  const app = await NestFactory.create(AppModule, {
    logger,
  });
  const loggerInstance = app.get(Logger);
  const auditLoggingSubscriber = app.get(AuditLoggingSubscriber);

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  app.useGlobalFilters(new CustomBaseExceptionFilter(loggerInstance));

  app.useGlobalInterceptors(new AuditLoggingSubscriberCreatorInterceptor(auditLoggingSubscriber));

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: "1",
    prefix: "api/v",
  });

  app.enableCors({
    methods: getAllowedMethods(),
    ...getCorsConfig(),
  });

  app.use(helmet());

  if (process.env.STAGE_ENV === "local") {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("Project API")
      .setDescription("The BE API for Project")
      .setVersion("1.0")
      .addBearerAuth()
      .build();
    const documentOptions: SwaggerDocumentOptions = {
      ignoreGlobalPrefix: true,
      operationIdFactory: (_: string, methodKey: string) => methodKey,
    };
    const document = SwaggerModule.createDocument(app, swaggerConfig, documentOptions);
    SwaggerModule.setup("swagger", app, document);
  }

  app.enableShutdownHooks();

  await app.listen(process.env.BE_PORT, () => {
    logger.log(`Listening on port ${process.env.BE_PORT}`);
  });
}
bootstrap();
