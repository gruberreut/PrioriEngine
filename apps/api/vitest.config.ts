import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globalSetup: ["./test/helpers/globalSetup.ts"],
    fileParallelism: false,
  },
});
