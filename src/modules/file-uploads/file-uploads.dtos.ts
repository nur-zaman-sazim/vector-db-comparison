import { ApiProperty } from "@nestjs/swagger";

import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from "class-validator";

import { EAllowedMimeTypes } from "./file-uploads.enums";

export class PresignedUrlFile {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ enum: EAllowedMimeTypes, enumName: "EAllowedMimeTypes" })
  @IsEnum(EAllowedMimeTypes)
  type!: EAllowedMimeTypes;
}

export class PresignedUrlFileDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PresignedUrlFile)
  files!: PresignedUrlFile[];
}

export class PresignedUrlResponse extends PresignedUrlFile {
  signedUrl!: string;
}
