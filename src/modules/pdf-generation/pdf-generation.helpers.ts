import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import { TDataDictionary } from "./pdf-generation.types";

dayjs.extend(utc);

export function flattenObjectForMapping<T extends object>(obj: T, prefix = ""): TDataDictionary {
  const result: TDataDictionary = {};

  function flatten<T extends object>(current: T, path: string = "") {
    if (Array.isArray(current)) {
      current.forEach((item, index) => {
        flatten(item, path ? `${path}[${index}]` : `[${index}]`);
      });
    } else if (!(current instanceof Date) && typeof current === "object" && current !== null) {
      Object.entries(current).forEach(([key, value]) => {
        flatten(value, path ? `${path}.${key}` : key);
      });
    } else {
      result[path] = current;
    }
  }

  flatten(obj, prefix);
  return result;
}
