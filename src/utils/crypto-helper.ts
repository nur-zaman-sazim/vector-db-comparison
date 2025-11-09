import argon2 from "argon2";
import { randomBytes } from "crypto";

import { ARGON2_OPTIONS } from "@/common/config/argon2.config";

export function hashString(inputString: string) {
  return argon2.hash(inputString, ARGON2_OPTIONS);
}

export function generateSecureHex(length: number): string {
  return randomBytes(length / 2).toString("hex");
}
