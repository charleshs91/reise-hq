import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    // No app-level tests yet; the scaffold is toolchain-only.
    passWithNoTests: true,
  },
});
