/**
 * `pnpm places:generate` — fetch OurAirports, filter to seedable airports, and
 * write `data/places/airports.json` (gitignored, never committed; ADR 0002).
 * Downloads are cached per day in `data/places/cache/`.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertPlausible,
  OURAIRPORTS_BASE_URL,
  parseCsv,
  selectAirports,
} from "../src/places/generate.ts";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const outDir = join(repoRoot, "data/places");
const cacheDir = join(outDir, "cache");
const fetchedOn = new Date().toISOString().slice(0, 10);

/** Reads today's cached copy, or downloads without caching yet. */
async function fetchCsv(
  file: string,
): Promise<{ text: string; fresh: boolean }> {
  try {
    return { text: await readFile(cachePath(file), "utf8"), fresh: false };
  } catch {
    const url = `${OURAIRPORTS_BASE_URL}/${file}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`GET ${url} failed: ${String(res.status)}`);
    return { text: await res.text(), fresh: true };
  }
}

const cachePath = (file: string) => join(cacheDir, `${fetchedOn}-${file}`);

const files = { airports: "airports.csv", countries: "countries.csv" } as const;
const airportsCsv = await fetchCsv(files.airports);
const countriesCsv = await fetchCsv(files.countries);
const airports = selectAirports(
  parseCsv(airportsCsv.text),
  parseCsv(countriesCsv.text),
);

try {
  assertPlausible(airports);
} catch (error) {
  console.error(`${(error as Error).message}. Nothing written.`);
  process.exit(1);
}

// Cache only downloads that produced a plausible set, so a bad fetch is retried.
await mkdir(cacheDir, { recursive: true });
for (const [file, csv] of [
  [files.airports, airportsCsv],
  [files.countries, countriesCsv],
] as const) {
  if (csv.fresh) await writeFile(cachePath(file), csv.text);
}

await writeFile(
  join(outDir, "airports.json"),
  JSON.stringify(
    {
      provenance: {
        source: OURAIRPORTS_BASE_URL,
        fetchedOn,
        rowCount: airports.length,
      },
      airports,
    },
    null,
    2,
  ),
);
console.log(
  `Wrote ${String(airports.length)} airports to data/places/airports.json`,
);
