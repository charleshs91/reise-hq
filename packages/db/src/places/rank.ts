import { foldText } from "./fold.ts";
import type { PlaceRow } from "./row.ts";

export const MIN_QUERY_LENGTH = 2;

/**
 * The Place ranking rule (place-fuzzy-search tickets 04 and 07). Lower is better;
 * null means the row does not match at all. An id matches by prefix only, never infix.
 */
function tier(place: PlaceRow, query: string): number | null {
  const id = place.id.toLowerCase();
  const city = foldText(place.city ?? "");
  const name = foldText(place.name);

  if (id === query) return 1;
  if (place.kind === "citySlug" && city.startsWith(query)) return 2;
  if (place.kind === "airport" && city.startsWith(query)) return 3;
  if (place.kind === "airport" && name.startsWith(query)) return 4;
  if (id.startsWith(query)) return 5;
  if (name.includes(query) || city.includes(query)) return 6;
  return null;
}

const typeOrder = { large_airport: 0, medium_airport: 1 } as const;

/** Ties: city slug first, then large before medium airport, then name. */
function tieBreak(a: PlaceRow, b: PlaceRow): number {
  const kind = Number(b.kind === "citySlug") - Number(a.kind === "citySlug");
  if (kind !== 0) return kind;
  const type =
    (a.type ? typeOrder[a.type] : 2) - (b.type ? typeOrder[b.type] : 2);
  if (type !== 0) return type;
  return a.name.localeCompare(b.name);
}

/** Every matching Place, best first. A query under two characters matches nothing. */
export function rankPlaces<T extends PlaceRow>(
  rawQuery: string,
  places: readonly T[],
): T[] {
  const query = foldText(rawQuery.trim());
  if (query.length < MIN_QUERY_LENGTH) return [];

  return places
    .map((place) => ({ place, tier: tier(place, query) }))
    .filter((r): r is { place: T; tier: number } => r.tier !== null)
    .sort((a, b) => a.tier - b.tier || tieBreak(a.place, b.place))
    .map((r) => r.place);
}
