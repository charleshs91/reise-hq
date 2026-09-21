# 06 — Places seed and the Skyscanner deep link

Parent: ../map.md
Spec: ../spec.md
Status: ready-for-agent
Depends on: none

## Goal

`packages/domain` can name a Place and turn a Search into a Skyscanner URL. Nothing
else in the app depends on knowing the URL shape.

## Scope

- A `Place` type as a closed union: `{ kind: "airport", iata }` or
  `{ kind: "citySlug", slug }`, plus a display name and the identifier used as its id.
- A checked-in curated list (JSON or a TS module) in `packages/domain`. Seed it with a
  few dozen plausible entries; every `citySlug` entry must be one observed in a real
  Skyscanner URL, never derived from an IATA metro code.
- `buildSkyscannerUrl(search)` returning the consumer URL documented in the spec:
  lowercased identifiers, `yymmdd` path segments, a one-way link being the missing
  second date segment, and `adults=1` / `cabinclass=economy` as constants.
- Currency, locale and market read from app config, not arguments the caller invents.

## Done when

- Unit tests cover one-way, round-trip, an airport-kind Place and a citySlug-kind Place.
- Grepping the repo for `skyscanner.net` finds exactly one source file.
- No database dependency is introduced into `packages/domain`.
