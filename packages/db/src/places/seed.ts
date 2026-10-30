import { sql } from "drizzle-orm";
import type { Db } from "../client.ts";
import { meta, places } from "../schema.ts";
import { foldText } from "./fold.ts";
import type { PlaceRow } from "./row.ts";

export type SeedablePlace = PlaceRow & { readonly searchText: string };

export type PlacesProvenance = {
  readonly source: string;
  readonly fetchedOn: string;
  readonly rowCount: number;
};

/** Generated airports with the curated overlay merged over them; the overlay always wins. */
export function mergePlaces(
  generated: readonly PlaceRow[],
  curated: readonly PlaceRow[],
): SeedablePlace[] {
  const curatedIds = new Set<string>();
  for (const place of curated) {
    if (curatedIds.has(place.id))
      throw new Error(`Duplicate curated Place id ${place.id}`);
    curatedIds.add(place.id);
  }

  const merged = [
    ...generated.filter((p) => !curatedIds.has(p.id)),
    ...curated,
  ];
  if (new Set(merged.map((p) => p.id)).size !== merged.length) {
    throw new Error("Duplicate Place ids in the generated set");
  }

  return merged.map((p) => ({
    ...p,
    searchText: foldText([p.name, p.city, p.id].filter(Boolean).join(" ")),
  }));
}

/**
 * Upserts every Place and records which dataset they came from. Idempotent;
 * never deletes, because a Search may already point at a Place a newer
 * dataset has dropped (ADR 0002's revisit trigger).
 */
export function seedPlaces(
  db: Db,
  rows: readonly SeedablePlace[],
  provenance: PlacesProvenance,
): void {
  db.transaction((tx) => {
    for (const row of rows) {
      tx.insert(places)
        .values(row)
        .onConflictDoUpdate({
          target: places.id,
          set: {
            kind: sql`excluded.kind`,
            name: sql`excluded.name`,
            city: sql`excluded.city`,
            country: sql`excluded.country`,
            type: sql`excluded.type`,
            searchText: sql`excluded.search_text`,
          },
        })
        .run();
    }
    const value = JSON.stringify({
      ...provenance,
      seededAt: new Date().toISOString(),
    });
    tx.insert(meta)
      .values({ key: "places_provenance", value })
      .onConflictDoUpdate({ target: meta.key, set: { value } })
      .run();
  });
}
