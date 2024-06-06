import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["__tests__/**/*.ts"],
    exclude: ["__tests__/mocks/*.ts"],
    globals: true,
    setupFiles: ["vitest.setup.ts"],
  },
});
