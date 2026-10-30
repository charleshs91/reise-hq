import type { PlaceRow } from "./row.ts";

export const OURAIRPORTS_BASE_URL =
  "https://davidmegginson.github.io/ourairports-data";

/** Below this, the download was truncated or the upstream shape changed (~3,244 expected). */
export const MIN_PLAUSIBLE_AIRPORTS = 2500;
/** Above this, the filter has stopped filtering. */
export const MAX_PLAUSIBLE_AIRPORTS = 4500;

type CsvRecord = Record<string, string>;

/** RFC 4180 CSV into records keyed by the header row. */
export function parseCsv(text: string): CsvRecord[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text.charAt(i);
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const [header, ...body] = rows;
  if (!header) return [];
  return body.map((cells) =>
    Object.fromEntries(header.map((key, j) => [key, cells[j] ?? ""])),
  );
}

/** IATA present, large or medium, scheduled service — shaped as Place rows. */
export function selectAirports(
  airports: CsvRecord[],
  countries: CsvRecord[],
): PlaceRow[] {
  const countryNames = new Map(
    countries.map((c) => [c.code ?? "", c.name ?? ""]),
  );

  return airports
    .filter(
      (a) =>
        Boolean(a.iata_code) &&
        (a.type === "large_airport" || a.type === "medium_airport") &&
        a.scheduled_service === "yes",
    )
    .map((a) => {
      const iata = a.iata_code ?? "";
      const country = countryNames.get(a.iso_country ?? "");
      if (!country) {
        throw new Error(
          `Airport ${iata} has unknown country ${a.iso_country ?? "(none)"}`,
        );
      }
      return {
        id: iata,
        kind: "airport",
        name: a.name ?? "",
        city: a.municipality || null,
        country,
        type: a.type as "large_airport" | "medium_airport",
      };
    });
}

/** Throws unless the filtered set is a plausible, uniquely-keyed airport list. */
export function assertPlausible(rows: readonly PlaceRow[]): void {
  if (
    rows.length < MIN_PLAUSIBLE_AIRPORTS ||
    rows.length > MAX_PLAUSIBLE_AIRPORTS
  ) {
    throw new Error(
      `Implausible airport count ${String(rows.length)} (expected ${String(MIN_PLAUSIBLE_AIRPORTS)}–${String(MAX_PLAUSIBLE_AIRPORTS)})`,
    );
  }
  if (new Set(rows.map((r) => r.id)).size !== rows.length) {
    throw new Error("Duplicate IATA codes in the filtered dataset");
  }
}
