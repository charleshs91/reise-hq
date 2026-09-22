/** `pnpm db:backup` — a consistent copy of ./data/reise.db into ./data/backups/. */
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DEFAULT_DB_PATH } from "../src/client.ts";

const backupDir = join(dirname(DEFAULT_DB_PATH), "backups");
mkdirSync(backupDir, { recursive: true });
const target = join(
  backupDir,
  `reise-${new Date().toISOString().replace(/[:.]/g, "-")}.db`,
);

// SQLite's online backup, not a raw file copy, so a WAL-mode database is copied whole.
await new Database(DEFAULT_DB_PATH, { fileMustExist: true }).backup(target);
console.log(`Backed up to ${target}`);
