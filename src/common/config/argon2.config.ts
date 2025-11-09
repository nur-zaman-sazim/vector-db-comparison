import * as argon2 from "argon2";

export const ARGON2_OPTIONS: argon2.Options & {
  raw?: false | undefined;
} = {
  memoryCost: 2 ** 12,
  parallelism: 1,
};
