import Database from "better-sqlite3";
import {
  drizzle,
  type BetterSQLite3Database,
} from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as schema from "./schema.ts";

export type Db = BetterSQLite3Database<typeof schema>;

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(packageRoot, "../..");

/** `./data/reise.db` at the repo root (ADR 0001), overridable for tests and tooling. */
export const DEFAULT_DB_PATH =
  process.env.REISE_DB_PATH ?? join(repoRoot, "data/reise.db");

/** Opens the database with foreign keys enforced; pass ":memory:" for a scratch one. */
export function openDb(path: string = DEFAULT_DB_PATH): Db {
  const sqlite = new Database(path);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return drizzle(sqlite, { schema });
}

/** Applies the generated SQL migrations. Never `drizzle-kit push`. */
export function applyMigrations(db: Db): void {
  migrate(db, { migrationsFolder: join(packageRoot, "migrations") });
}
