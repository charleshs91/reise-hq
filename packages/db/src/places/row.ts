/**
 * One row of the seeded `places` table: a Place plus what search matches on or
 * displays. `id` is the Skyscanner identifier; `kind` is stored, never derived.
 */
export type PlaceRow = {
  readonly id: string;
  readonly kind: "airport" | "citySlug";
  readonly name: string;
  readonly city: string | null;
  readonly country: string;
  readonly type: "large_airport" | "medium_airport" | null;
};
