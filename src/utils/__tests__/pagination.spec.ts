import { computePaginationMetadata } from "../pagination";

describe("computePaginationMetadata", () => {
  it("should compute correct metadata for first page with more pages available", () => {
    const result = computePaginationMetadata({
      page: 1,
      limit: 10,
      totalItems: 25,
    });

    expect(result).toEqual({
      currentPage: 1,
      itemsPerPage: 10,
      totalItems: 25,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: false,
    });
  });

  it("should compute correct metadata for middle page", () => {
    const result = computePaginationMetadata({
      page: 2,
      limit: 10,
      totalItems: 25,
    });

    expect(result).toEqual({
      currentPage: 2,
      itemsPerPage: 10,
      totalItems: 25,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: true,
    });
  });

  it("should compute correct metadata for last page", () => {
    const result = computePaginationMetadata({
      page: 3,
      limit: 10,
      totalItems: 25,
    });

    expect(result).toEqual({
      currentPage: 3,
      itemsPerPage: 10,
      totalItems: 25,
      totalPages: 3,
      hasNextPage: false,
      hasPreviousPage: true,
    });
  });

  it("should handle single page case", () => {
    const result = computePaginationMetadata({
      page: 1,
      limit: 10,
      totalItems: 5,
    });

    expect(result).toEqual({
      currentPage: 1,
      itemsPerPage: 10,
      totalItems: 5,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });
  });

  it("should handle empty data case", () => {
    const result = computePaginationMetadata({
      page: 1,
      limit: 10,
      totalItems: 0,
    });

    expect(result).toEqual({
      currentPage: 1,
      itemsPerPage: 10,
      totalItems: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    });
  });
});
