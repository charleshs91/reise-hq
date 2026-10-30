/** `pnpm db:migrate` — apply generated SQL migrations to ./data/reise.db. */
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { applyMigrations, DEFAULT_DB_PATH, openDb } from "../src/client.ts";

mkdirSync(dirname(DEFAULT_DB_PATH), { recursive: true });
applyMigrations(openDb());
console.log(`Migrated ${DEFAULT_DB_PATH}`);
