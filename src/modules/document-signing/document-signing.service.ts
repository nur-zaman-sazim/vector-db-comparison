import { HttpService } from "@nestjs/axios";
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import type { AxiosRequestConfig } from "axios";
import dayjs from "dayjs";

import {
  DOCUSEAL_API_URL,
  DOCUSEAL_CREATE_SUBMISSION_PATH,
  DOCUSEAL_CREATE_TEMPLATE_PATH,
  DOCUSEAL_SUBMISSION_EXPIRY_IN_DAYS,
  DOCUSEAL_TEMPLATE_FILE_NAME,
  DOCUSEAL_TEMPLATE_FOLDER_NAME,
  DOCUSEAL_TEMPLATE_NAME,
} from "./document-signing.constants";
import {
  TDocusealCreateTemplateRequest,
  TDocusealCreateTemplateResponse,
  TDocusealSubmissionRequest,
  TDocusealSubmitter,
  TDocusealWebhookPayload,
} from "./document-signing.types";

@Injectable()
export class DocumentSigningService {
  private readonly logger: Logger = new Logger(DocumentSigningService.name);

  private readonly config: AxiosRequestConfig<unknown>;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const docusealApiKey = this.configService.getOrThrow<string>("DOCUSEAL_API_KEY");

    const headers: Record<string, string> = {
      "X-Auth-Token": docusealApiKey,
      "Content-Type": "application/json",
    };

    this.config = {
      headers,
    };
  }

  async convertPdfToBase64(documentPath: string): Promise<string> {
    try {
      const documentUrl = new URL(documentPath, this.configService.getOrThrow("AWS_S3_BUCKET_URL"))
        .href;
      const { data } = await this.httpService.axiosRef.get(documentUrl, {
        responseType: "arraybuffer",
      });
      return Buffer.from(data).toString("base64");
    } catch (error) {
      this.logger.warn("Error converting PDF to base64 string", error);
      throw new Error("Something wrong fetching Contract Document");
    }
  }

  async createTemplate(documentUrl: string): Promise<TDocusealCreateTemplateResponse> {
    const pdfBase64String = await this.convertPdfToBase64(documentUrl);

    const url = new URL(DOCUSEAL_CREATE_TEMPLATE_PATH, DOCUSEAL_API_URL).toString();

    const createTemplateRequest: TDocusealCreateTemplateRequest = {
      name: DOCUSEAL_TEMPLATE_NAME,
      folder_name: DOCUSEAL_TEMPLATE_FOLDER_NAME,
      documents: [
        {
          name: DOCUSEAL_TEMPLATE_FILE_NAME,
          file: pdfBase64String,
        },
      ],
    };

    try {
      const response = await this.httpService.axiosRef.post(
        url,
        createTemplateRequest,
        this.config,
      );
      return response.data;
    } catch (error) {
      this.logger.error("Error creating template", error);
      throw new Error("Error creating template");
    }
  }

  async createSubmission(submissionDetails: {
    documentUrl: string;
    submitterEmail: string;
    documentId: number;
  }) {
    const templateResponse = await this.createTemplate(submissionDetails.documentUrl);

    const submitters: TDocusealSubmitter[] = [
      {
        uuid: templateResponse.submitters[0].uuid,
        email: submissionDetails.submitterEmail,
        role: templateResponse.submitters[0].name,
        metadata: {
          document_id: submissionDetails.documentId,
        },
      },
    ];

    const url = new URL(DOCUSEAL_CREATE_SUBMISSION_PATH, DOCUSEAL_API_URL).toString();

    const submissionRequest: TDocusealSubmissionRequest = {
      template_id: templateResponse.id,
      submitters: submitters,
      preferences: {
        send_email: true,
      },
      expire_at: dayjs().add(DOCUSEAL_SUBMISSION_EXPIRY_IN_DAYS, "day").toISOString(),
    };

    try {
      const response = await this.httpService.axiosRef.post(url, submissionRequest, this.config);

      const submissionId = response.data[0]?.submission_id;

      if (!submissionId) {
        throw new BadRequestException("Error creating submission");
      }

      return response.data;
    } catch (error) {
      this.logger.error("Error creating submission", error);
      throw new InternalServerErrorException("Error creating submission");
    }
  }

  handleWebhook(_payload: TDocusealWebhookPayload) {
    throw new Error("Method not implemented.");
  }
}
