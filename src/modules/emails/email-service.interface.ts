export interface IEmailService {
  sendEmailByTextOrHtml(params: {
    to: string;
    subject: string;
    from?: string;
    text?: string;
    html?: string;
  }): Promise<void>;

  sendEmailByTemplateId(params: {
    to: string;
    from?: string;
    templateId: string;
    templateData?: Record<string, unknown>;
  }): Promise<void>;
}
