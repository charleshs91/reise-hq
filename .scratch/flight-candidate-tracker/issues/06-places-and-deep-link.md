# 06 — Places generation and the Skyscanner deep link

Parent: ../map.md
Spec: ../spec.md
Status: resolved
Depends on: none

## Goal

`packages/domain` can name a Place and turn a Search into a Skyscanner URL. Nothing
else in the app depends on knowing the URL shape.

## Scope

- A `Place` type as a closed union: `{ kind: "airport", iata }` or
  `{ kind: "citySlug", slug }`, plus a display name and the identifier used as its id.
- `pnpm places:generate`: fetch OurAirports `airports.csv` + `countries.csv`, filter
  (IATA present, large/medium, `scheduled_service = 'yes'`), record provenance, cache
  downloads, and fail loudly on an implausible row count. Output is not committed and
  does not live in `packages/domain`
  ([ADR 0002](../../../docs/adr/0002-places-seeded-from-an-open-dataset.md)).
- The committed **curated overlay** holding the 14 verified city slugs from
  [Verify every curated city slug](../../place-fuzzy-search/issues/02-verify-city-slugs.md).
  Its header comment is the verification ritual for adding a city: search Skyscanner by
  hand, read the slug off the URL, confirm the results span the city's airports. Never
  derive a slug from an IATA metro code.
- `packages/domain` holds the `Place` type and no Place data.
- `buildSkyscannerUrl(search)` returning the consumer URL documented in the spec:
  lowercased identifiers, `yymmdd` path segments, a one-way link being the missing
  second date segment, and `adults=1` / `cabinclass=economy` as constants.
- Currency, locale and market read from app config, not arguments the caller invents.

## Done when

- Unit tests cover one-way, round-trip, an airport-kind Place and a citySlug-kind Place,
  constructing Places as literals rather than reading a list.
- `pnpm places:generate` produces ~3,244 airports and refuses an implausible count.
- Grepping the repo for `skyscanner.net` finds exactly one source file.
- No database dependency is introduced into `packages/domain`.
