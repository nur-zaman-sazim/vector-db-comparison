import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    root: "./",
    include: ["**/*.spec.ts", "!**/*.int.spec.ts"],
    env: {
      // vitest overrides this for some reason: https://github.com/vitest-dev/vitest/discussions/5695
      BASE_URL: process.env["BASE_URL"] ?? "/",
    },
  },
  resolve: {
    alias: {
      // @ts-expect-error - This is a workaround for a TypeScript bug
      "@/test/": new URL("./test/", import.meta.url).pathname,
      // @ts-expect-error - This is a workaround for a TypeScript bug
      "@/": new URL("./src/", import.meta.url).pathname,
    },
  },
  plugins: [swc.vite()],
});
