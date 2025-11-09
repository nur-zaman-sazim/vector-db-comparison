import { Logger, MiddlewareConsumer, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { MikroOrmModule } from "@mikro-orm/nestjs";

import { OpenTelemetryModule } from "@metinseylan/nestjs-opentelemetry";

import { AuditLoggingModule } from "./common/audit-logging/audit-logging.module";
import { AuditLoggingSubscriber } from "./common/audit-logging/audit-logging.subscriber";
import { AppLoggerMiddleware } from "./common/middleware/request-logger.middleware";
import { validate } from "./common/validators/env.validator";
import ormConfig from "./db/db.config";
import { AuthModule } from "./modules/auth/auth.module";
import { DocumentSigningModule } from "./modules/document-signing/document-signing.module";
import { EmailsModule } from "./modules/emails/emails.module";
import { FileUploadsModule } from "./modules/file-uploads/file-uploads.module";
import { HealthModule } from "./modules/health/health.module";
import { PdfGenerationModule } from "./modules/pdf-generation/pdf-generation.module";
import { RolesModule } from "./modules/roles/roles.module";
import { UserProfilesModule } from "./modules/user-profiles/user-profiles.module";
import { UsersModule } from "./modules/users/users.module";
import { VectorBenchmarksModule } from "./modules/vector-benchmarks/vector-benchmarks.module";
import { VerificationRequestsModule } from "./modules/verification-requests/verification-requests.module";
import { WebsocketExampleModule } from "./modules/websocket-example/websocket-example.module";
import { PermissionsModule } from "./permissions/permissions.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      ignoreEnvFile: false,
      isGlobal: true,
      validate,
    }),

    MikroOrmModule.forRootAsync({
      imports: [AuditLoggingModule],
      useFactory: (auditLoggingSubscriber: AuditLoggingSubscriber) => ({
        ...ormConfig,
        subscribers: [auditLoggingSubscriber],
      }),
      inject: [AuditLoggingSubscriber],
    }),

    OpenTelemetryModule.forRoot({
      serviceName: "Project Backend",
    }),

    EmailsModule,

    AuditLoggingModule,

    UsersModule,
    AuthModule,
    RolesModule,
    FileUploadsModule,
    WebsocketExampleModule,
    UserProfilesModule,
    HealthModule,
    PdfGenerationModule,
    DocumentSigningModule,
    VerificationRequestsModule,
    PermissionsModule,
    VectorBenchmarksModule,
  ],
  controllers: [],
  providers: [Logger],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AppLoggerMiddleware).forRoutes("*");
  }
}
