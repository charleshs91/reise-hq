/**
 * `pnpm db:seed` — merge data/places/airports.json (from `pnpm places:generate`)
 * with the curated overlay and upsert into `places`. Idempotent.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { DEFAULT_DB_PATH, openDb } from "../src/client.ts";
import { curatedPlaces } from "../src/places/curated.ts";
import { assertPlausible } from "../src/places/generate.ts";
import type { PlaceRow } from "../src/places/row.ts";
import {
  mergePlaces,
  seedPlaces,
  type PlacesProvenance,
} from "../src/places/seed.ts";

const inputPath = join(dirname(DEFAULT_DB_PATH), "places/airports.json");

let input: { provenance: PlacesProvenance; airports: PlaceRow[] };
try {
  input = JSON.parse(readFileSync(inputPath, "utf8")) as typeof input;
} catch {
  console.error(
    `No readable ${inputPath}. Run \`pnpm places:generate\` first (needs network).`,
  );
  process.exit(1);
}

assertPlausible(input.airports);
const rows = mergePlaces(input.airports, curatedPlaces);
seedPlaces(openDb(), rows, input.provenance);
console.log(
  `Seeded ${String(rows.length)} places (${String(input.airports.length)} airports from ${input.provenance.fetchedOn} + ${String(curatedPlaces.length)} curated)`,
);
