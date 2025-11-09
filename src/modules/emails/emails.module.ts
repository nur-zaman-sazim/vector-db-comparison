import { Module } from "@nestjs/common";

import { EMAIL_SERVICE_TOKEN } from "./emails.constants";
import { SendgridEmailService } from "./sendgrid-email.service";

@Module({
  providers: [
    {
      provide: EMAIL_SERVICE_TOKEN,
      useClass: SendgridEmailService,
    },
  ],
  exports: [EMAIL_SERVICE_TOKEN],
})
export class EmailsModule {}
