import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { ListObjectsCommandOutput, PutObjectCommand, S3, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { isLocal } from "@/utils/env";

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);

  constructor(
    private readonly s3: S3,
    private readonly s3Client: S3Client,
    private readonly bucketName: string,
    private readonly config: ConfigService,
  ) {}

  private getFolderName() {
    const stageEnv = this.config.get("STAGE_ENV");
    const isLocalEnv = isLocal(stageEnv);

    return isLocalEnv ? "" : stageEnv === "development" ? "dev" : "prod";
  }

  private getUploadFilename(key: string) {
    return `${this.getFolderName()}/${key}`;
  }

  getBucketContents(): Promise<ListObjectsCommandOutput> {
    this.logger.log(`Getting bucket contents for bucket ${this.bucketName}`);

    return this.s3.listObjects({
      Bucket: this.bucketName,
    });
  }

  getPresignedUrl(key: string, type: string): Promise<string> {
    this.logger.log(`Getting presigned URL for key ${key}`);

    const uploadFilename = this.getUploadFilename(key);

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: uploadFilename,
      ContentType: type,
      ACL: "public-read",
    });
    const expiryInMinutes = this.config.get<number>("AWS_S3_PRESIGN_URL_EXPIRY_IN_MINUTES", {
      infer: true,
    })!;
    return getSignedUrl(this.s3Client, command, { expiresIn: expiryInMinutes * 60 });
  }

  async uploadFileBuffer(key: string, type: string, buffer: Buffer): Promise<string> {
    this.logger.log(`Uploading ${type} buffer with key ${key}`);
    const uploadFilename = this.getUploadFilename(key);

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: uploadFilename,
      Body: buffer,
      ContentType: type,
      ACL: "public-read",
    });

    await this.s3Client.send(command);

    return this.getPresignedUrl(key, type);
  }
}
