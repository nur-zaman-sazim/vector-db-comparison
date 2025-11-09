import { Transform } from "class-transformer";
import type { TransformOptions } from "class-transformer";

export function TransformQueryParamToStringArray(
  options?: (TransformOptions & { separator?: string }) | undefined,
) {
  const { separator = ",", ...rest } = options ?? {};

  return Transform(
    ({ value }) =>
      decodeURIComponent(value)
        .split(separator)
        .map((val: string) => val.trim()),
    rest,
  );
}
