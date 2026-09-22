import { defineConfig } from "drizzle-kit";

// Generate only. Migrations are applied by `pnpm db:migrate`; never `drizzle-kit push`.
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/schema.ts",
  out: "./migrations",
});
