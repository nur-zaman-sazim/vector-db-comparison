import { plainToInstance } from "class-transformer";
import { IsArray, IsString, validate } from "class-validator";

import { TransformQueryParamToStringArray } from "../transform-query-param-to-string-array.decorator";

describe("TransformQueryParamToStringArray", () => {
  it("properly parses a dto containing a set of strings separated by commas", async () => {
    class MockDto {
      @IsArray()
      @IsString({ each: true })
      @TransformQueryParamToStringArray({ separator: "," })
      arrayOfStrings!: string[];
    }

    const pojo = { arrayOfStrings: "string1, string2, string3" };
    const dto = plainToInstance(MockDto, pojo);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.arrayOfStrings).toEqual(["string1", "string2", "string3"]);
  });

  it("properly parses a dto containing a set of strings separated by a pipe", async () => {
    class MockDto {
      @IsArray()
      @IsString({ each: true })
      @TransformQueryParamToStringArray({ separator: "|" })
      arrayOfStrings!: string[];
    }

    const pojo = { arrayOfStrings: "string1| string2| string3" };
    const dto = plainToInstance(MockDto, pojo);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.arrayOfStrings).toEqual(["string1", "string2", "string3"]);
  });

  it("properly parses a dto containing a set of strings separated by encoded comma", async () => {
    class MockDto {
      @IsArray()
      @IsString({ each: true })
      @TransformQueryParamToStringArray({ separator: "," })
      arrayOfStrings!: string[];
    }

    const pojo = { arrayOfStrings: "string1%2C string2%2C string3" };
    const dto = plainToInstance(MockDto, pojo);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.arrayOfStrings).toEqual(["string1", "string2", "string3"]);
  });

  it("defaults to comma as the separator if not specified", async () => {
    class MockDto {
      @IsArray()
      @IsString({ each: true })
      @TransformQueryParamToStringArray()
      arrayOfStrings!: string[];
    }

    const pojo = { arrayOfStrings: "string1, string2, string3" };
    const dto = plainToInstance(MockDto, pojo);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.arrayOfStrings).toEqual(["string1", "string2", "string3"]);
  });

  it("trims the values of the array", async () => {
    class MockDto {
      @IsArray()
      @IsString({ each: true })
      @TransformQueryParamToStringArray({ separator: "," })
      arrayOfStrings!: string[];
    }

    const pojo = { arrayOfStrings: "    string1  , string2   , string3     " };
    const dto = plainToInstance(MockDto, pojo);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.arrayOfStrings).toEqual(["string1", "string2", "string3"]);
  });
});
