import "server-only";
import { openDb, type Db } from "@reise-hq/db";
import { join } from "node:path";

// `next dev` runs from apps/web; the database lives at the repo root (ADR 0001).
const path =
  process.env.REISE_DB_PATH ?? join(process.cwd(), "../../data/reise.db");

const globalForDb = globalThis as unknown as { reiseDb?: Db };

/** One connection per server process, surviving dev hot reloads. */
export function db(): Db {
  globalForDb.reiseDb ??= openDb(path);
  return globalForDb.reiseDb;
}
