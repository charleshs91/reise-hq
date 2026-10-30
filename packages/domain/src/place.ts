/**
 * A known origin or destination. Its `id` is the Skyscanner identifier itself:
 * an IATA code for an airport, a hand-verified city slug for a multi-airport city.
 * The two are different systems, so the kind is explicit, never inferred from length.
 */
export type Place = {
  readonly id: string;
  readonly name: string;
} & (
  | { readonly kind: "airport"; readonly iata: string }
  | { readonly kind: "citySlug"; readonly slug: string }
);

/** The identifier Skyscanner takes for this Place. */
export function skyscannerIdentifier(place: Place): string {
  return place.kind === "airport" ? place.iata : place.slug;
}
