import { defineConfig } from "eslint/config";
import { includeIgnoreFile } from "@eslint/compat";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tseslint from "typescript-eslint";
import { fileURLToPath } from "node:url";

const webFiles = ["apps/web/**/*.{ts,tsx}"];

export default defineConfig([
  // Build output is already enumerated in .gitignore; don't restate it here.
  includeIgnoreFile(fileURLToPath(new URL(".gitignore", import.meta.url))),
  { ignores: ["**/*.config.mjs"] },

  // Type-aware linting for every package. projectService resolves the nearest
  // tsconfig.json per file, so packages need no config of their own.
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Next.js rules apply to the web app only, and its rules that look for the
  // app on disk need to be told the app is not at the repo root.
  ...[...nextVitals, ...nextTs].map((config) => ({
    ...config,
    files: webFiles,
  })),
  { files: webFiles, settings: { next: { rootDir: "apps/web" } } },
]);
