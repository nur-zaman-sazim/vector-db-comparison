import { Module } from "@nestjs/common";

import { AuditLoggingSubscriber } from "./audit-logging.subscriber";

@Module({
  providers: [AuditLoggingSubscriber],
  exports: [AuditLoggingSubscriber],
})
export class AuditLoggingModule {}
