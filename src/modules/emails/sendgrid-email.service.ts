import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import sgMail, { MailDataRequired } from "@sendgrid/mail";

import { IEmailService } from "./email-service.interface";

@Injectable()
export class SendgridEmailService implements IEmailService {
  private readonly logger = new Logger(SendgridEmailService.name);
  private readonly defaultSenderEmail: string;

  constructor(private readonly configService: ConfigService) {
    this.defaultSenderEmail = this.configService.getOrThrow<string>("SEND_FROM_EMAIL");
    const sendGridApiKey = this.configService.getOrThrow<string>("SENDGRID_API_KEY");
    sgMail.setApiKey(sendGridApiKey);
  }

  async sendEmailByTextOrHtml({
    to,
    subject,
    from = this.defaultSenderEmail,
    text = "",
    html = "",
  }: {
    to: string;
    subject: string;
    from?: string;
    text?: string;
    html?: string;
  }): Promise<void> {
    const msg: MailDataRequired | MailDataRequired[] = {
      to,
      from,
      subject,
      text,
      html,
    };

    try {
      await sgMail.send(msg);
      this.logger.log(`Email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}. Error occurred: ${error}`, error);
    }
  }

  async sendEmailByTemplateId({
    to,
    from = this.defaultSenderEmail,
    templateId,
    templateData,
  }: {
    to: string;
    from?: string;
    templateId: string;
    templateData?: Record<string, unknown>;
  }): Promise<void> {
    let mailData: { to: string; from: string; templateId: string; dynamicTemplateData?: object } = {
      to,
      from,
      templateId,
    };

    if (templateData && Object.keys(templateData).length > 0) {
      mailData = { ...mailData, dynamicTemplateData: { ...templateData } };
    }

    try {
      await sgMail.send(mailData);
      this.logger.log(`Email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}. Error occurred: ${error}`, error);
    }
  }
}
