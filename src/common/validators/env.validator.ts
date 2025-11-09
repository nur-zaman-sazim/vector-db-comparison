import { plainToInstance } from "class-transformer";
import { IsIn, IsNumber, IsOptional, IsPositive, IsString, validateSync } from "class-validator";

import { IEnvironmentVariables } from "../interfaces/environment-variables.interface";

class EnvironmentVariables implements IEnvironmentVariables {
  @IsString()
  NODE_ENV!: string;

  @IsString()
  @IsIn(["local", "development", "staging", "production", "test"])
  STAGE_ENV!: "local" | "development" | "staging" | "production" | "test";

  @IsNumber()
  @IsPositive()
  BE_PORT!: number;

  @IsNumber()
  @IsPositive()
  BE_WS_PORT!: number;

  @IsString()
  API_HEALTH_URL!: string;

  @IsString()
  DATABASE_URL!: string;

  @IsString()
  JWT_SECRET!: string;

  @IsString()
  JWT_TOKEN_LIFETIME!: string;

  @IsString()
  AWS_S3_REGION!: string;

  @IsString()
  AWS_S3_ENDPOINT!: string;

  @IsString()
  AWS_S3_BUCKET_NAME!: string;

  @IsNumber()
  @IsPositive()
  AWS_S3_PRESIGN_URL_EXPIRY_IN_MINUTES!: number;

  @IsString()
  AWS_S3_BUCKET_URL!: string;

  @IsString()
  @IsOptional()
  DOCUSEAL_API_KEY!: string;

  @IsString()
  SENDGRID_API_KEY!: string;

  @IsOptional()
  @IsString()
  @IsIn(["true", "false"])
  ENABLE_AUDIT_LOGGING: "true" | "false" = "false";

  @IsString()
  GOOGLE_CLIENT_ID!: string;

  @IsString()
  GOOGLE_CLIENT_SECRET!: string;

  @IsString()
  WEB_CLIENT_BASE_URL!: string;

  @IsString()
  SEND_FROM_EMAIL!: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
