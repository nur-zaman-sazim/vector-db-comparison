import { Type } from "class-transformer";
import { IsOptional, IsInt, Min } from "class-validator";

import { TPaginationMetadata } from "../types/pagination.types";

export class PaginationArgsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 10;
}

export class PaginationMetadataResponse implements TPaginationMetadata {
  currentPage!: number;
  itemsPerPage!: number;
  totalItems!: number;
  totalPages!: number;
  hasNextPage!: boolean;
  hasPreviousPage!: boolean;
}

export class PaginatedResponse {
  meta!: PaginationMetadataResponse;
}
