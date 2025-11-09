import { BadRequestException } from "@nestjs/common";
import { ArgumentMetadata } from "@nestjs/common/interfaces";

import { ParseEnumArrayOptions, ParseEnumArrayPipe } from "@/common/pipes/parse-enum-array";

describe("ParseEnumArrayPipe", () => {
  enum ESomeEnum {
    value1 = "value1",
    value2 = "value2",
    value3 = "value3",
  }

  const options: ParseEnumArrayOptions = {
    optional: false,
    separator: ",",
  };

  let pipe: ParseEnumArrayPipe<ESomeEnum>;

  beforeEach(() => {
    pipe = new ParseEnumArrayPipe(ESomeEnum, options);
  });

  describe("transform", () => {
    it("should return undefined if value is optional and not provided", () => {
      const value: string | undefined = undefined;
      const metadata: ArgumentMetadata = { type: "query", metatype: String, data: "" };

      options.optional = true;
      const result = pipe.transform(value, metadata);

      expect(result).toBeUndefined();
    });

    it("should throw BadRequestException if value is not provided", () => {
      const value: string | undefined = undefined;
      const metadata: ArgumentMetadata = { type: "query", metatype: String, data: "" };

      options.optional = false;

      expect(() => {
        pipe.transform(value, metadata);
      }).toThrow(BadRequestException);
    });

    it("should not throw BadRequestException if value is not provided but optional is true", () => {
      const value: string | undefined = undefined;
      const metadata: ArgumentMetadata = { type: "query", metatype: String, data: "" };

      options.optional = true;

      expect(() => {
        pipe.transform(value, metadata);
      }).not.toThrow(BadRequestException);
    });

    it("should throw BadRequestException if value contains invalid enum value", () => {
      const value = "value1,value2,value4";
      const metadata: ArgumentMetadata = { type: "query", metatype: String, data: "" };

      expect(() => {
        pipe.transform(value, metadata);
      }).toThrow(BadRequestException);
    });

    it("should return an array of valid enum values", () => {
      const value = "value1,value2,value3";
      const metadata: ArgumentMetadata = { type: "query", metatype: String, data: "" };

      const result = pipe.transform(value, metadata);

      expect(result).toEqual(["value1", "value2", "value3"]);
    });

    it("should return an array of valid enum values with encoded query params", () => {
      const value = "value1%2Cvalue2%2Cvalue3";
      const metadata: ArgumentMetadata = { type: "query", metatype: String, data: "" };

      const result = pipe.transform(value, metadata);

      expect(result).toEqual(["value1", "value2", "value3"]);
    });
  });
});
