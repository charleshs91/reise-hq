# 03 — Where Places live and how they are seeded

Parent: ../map.md
Type: grilling
Status: resolved
Blocked by: none <!-- 01 resolved -->

## Question

Settle the storage and seeding story for the widened Place set, then say precisely how
the existing v1 slices change.

- **The table.** Place becomes a seeded SQLite table in `packages/db` rather than a
  constant in `packages/domain`. What are its columns, given matching is over name,
  city and IATA and country is display-only? Where does `kind` (`airport` /
  `citySlug`) sit, and does the table keep `id` = the Skyscanner identifier as ADR 0001
  requires, with a uniqueness assertion across both kinds?
- **The two seed inputs.** A generated airports file (derived from the source in 01,
  regenerable, never hand-edited) plus a small hand-written curated file holding the
  city slugs and any override. Confirm the shape of each, where they live, and the
  conflict rule when both describe the same identifier. The curated file's content is
  already settled: the verified 14 from [02](02-verify-city-slugs.md).
- **Regeneration.** What command produces the generated file, and is the file committed
  or built at seed time? Committed means a reviewable diff and no network at install;
  built means no large blob in git history.
- **What `packages/domain` keeps.** The `Place` _type_ is domain language and stays.
  Does anything else — does `buildSkyscannerUrl()` still take a Place, and who reads it
  out of the database?
- **The filter, settled properly.** [01](01-airport-dataset-source.md) found that 29% of
  the 4,568 filtered rows have `scheduled_service = no` — including 22 typed
  `large_airport` (İstanbul Atatürk, Boryspil, Kadena Air Base, a not-yet-open Western
  Sydney). A link to one returns a plausible page for a route nobody flies. Requiring
  `scheduled_service = 'yes'` cuts the set to 3,244. Decide, knowing that `type` and
  `scheduled_service` both lag reality upstream.
- **The 121 rows with no `municipality`** need a display fallback; they must not be
  dropped.
- **Say plainly what `Place.id` is**, because the next reader will trip on it: for
  `kind: "airport"` the IATA code _is_ the Skyscanner identifier (the consumer URL takes
  it bare and lowercased), so no mapping layer exists or is needed. Only city slugs are a
  separate Skyscanner-proprietary system.
- **Does this warrant an ADR?** Moving the Place set from a curated constant to seeded
  data is hard to reverse and surprising to a reader of ADR 0001. Decide, and write it
  if so.
- **The v1 slices.** Name the concrete edits to
  [issue 06](../../flight-candidate-tracker/issues/06-places-and-deep-link.md) and
  [issue 07](../../flight-candidate-tracker/issues/07-schema-and-migrations.md).

## Answer

### The table

`places` in `packages/db`, seeded, never a constant in `packages/domain`:

| Column    | Type                          | Notes                                                   |
| --------- | ----------------------------- | ------------------------------------------------------- |
| `id`      | text, PK                      | **the Skyscanner identifier itself**                    |
| `kind`    | text, `airport` \| `citySlug` | stored explicitly, never derived                        |
| `name`    | text, not null                | display name; matched                                   |
| `city`    | text, **nullable**            | matched when present                                    |
| `country` | text, not null                | displayed only, never matched                           |
| `type`    | text, nullable                | `large_airport` / `medium_airport`; null for city slugs |

**`Place.id` is the Skyscanner identifier**, and for `kind: "airport"` that identifier
_is_ the IATA code — the consumer URL takes it bare and lowercased. There is no mapping
layer between OurAirports and Skyscanner and none is needed. Only city slugs are a
separate, proprietary system, which is why they are hand-verified.

`kind` is stored rather than derived from identifier length. Airports are 3 characters and
slugs 4 today, but `CSHA` and `CGKI` already show slugs have no consistent shape, and
inferring meaning from string length breaks silently the first time that changes.
`CONTEXT.md` calls these two different systems; the schema says so out loud.

`type` is carried **on the assumption that [the match and ranking rule](04-match-and-ranking-rule.md)
wants it for tie-breaking** (large above medium). It is one short column over ~3,244 rows.
If 04 settles on a ranking that ignores airport size, drop the column — that is the one
live coupling between these two tickets. Nothing else from OurAirports is stored:
coordinates, ICAO, elevation and `keywords` are all out. Store what you match or display.

`city` is nullable because 121 filtered rows have no `municipality` (RUR Rurutu, TIU
Timaru — real destinations). Display falls back to the airport name alone. A null that
renders sensibly beats an invented value that later reads as data.

### The filter

**IATA present, type `large_airport`/`medium_airport`, and `scheduled_service = 'yes'` —
~3,244 rows.** The 1,324 rows dropped by the last clause include 22 large airports:
İstanbul Atatürk (no scheduled passenger traffic since 2019), Boryspil, Kadena Air Base, a
not-yet-open Western Sydney. Each would generate a plausible page for a route nobody
flies — the same silent-failure mode [Verify every curated city slug](02-verify-city-slugs.md)
just measured at 45%. The counter-risk, a real airport wrongly flagged `no` upstream, is
recoverable: the curated overlay is exactly the hatch for adding one back by hand.

### The two seed inputs

1. **Generated airports** — derived from OurAirports by `pnpm places:generate`, never
   hand-edited.
2. **Curated overlay** — hand-written, holding the 14 verified city slugs from
   [02](02-verify-city-slugs.md) and any airport override. This file is committed, tiny,
   and every entry in it was verified by a human against a live Skyscanner page.

**Merge rule: the curated file always wins**, and the seed script **asserts uniqueness
across the merged set and fails loudly** rather than last-write-wins. The two cannot
collide on `id` as things stand — generated ids are 3-letter IATA, curated ones 4-letter
slugs — so the assertion exists to catch the day that stops being true, not to resolve a
conflict anyone expects.

### Regeneration: built at seed time, not committed

**The generated file is not committed.** `pnpm places:generate` fetches
`airports.csv` + `countries.csv`, applies the filter, and writes the seed input; `pnpm
db:seed` merges it with the curated overlay and loads the table. No ~534 KB blob enters
git history.

The cost is real and must be handled rather than ignored, because the upstream data is
**regenerated nightly**: seeding needs network access, and two clones seeded on different
days will hold different Place sets.

- The downloaded CSVs are **cached to a gitignored directory** so repeated seeds in a
  session are neither re-fetched nor at the mercy of a flaky network.
- The seed **records its provenance** — source URL, fetch date, and post-filter row
  count — so "which dataset is this database holding?" is answerable after the fact.
  Without this, an undiagnosable difference between two installs is the failure mode.
- The seed is **idempotent**: re-running it updates rows in place and never duplicates.
- It **fails loudly on an implausible row count** (say, below 2,500) rather than seeding a
  truncated download over a good table.

### What `packages/domain` keeps

The `Place` **type** and `buildSkyscannerUrl(search)` — both domain language, neither
touching the database. `searchPlaces(query)` reads SQLite and so lives in `packages/db`.

Consequence worth writing into the spec: **`packages/domain` no longer holds any Place
data**, so its tests construct Places as literals. This is a straight improvement — the
URL builder's tests stop depending on whether LHR happens to be in a checked-in list.

### ADR

**Yes** — [ADR 0002](../../../docs/adr/0002-places-seeded-from-an-open-dataset.md),
amending rather than superseding [ADR 0001](../../../docs/adr/0001-sqlite-for-single-user-storage.md):
the storage choice is unchanged, only the Place set's provenance moves.

### Edits the v1 slices need

[Amend the v1 spec](06-amend-the-v1-spec.md) applies these; they are named here, not made.

**[Issue 06 — Places seed and the Skyscanner deep link](../../flight-candidate-tracker/issues/06-places-and-deep-link.md):**

- Drop "a checked-in curated list (JSON or a TS module) in `packages/domain`. Seed it with
  a few dozen plausible entries" — the airport set is generated, not checked in, and not
  in `packages/domain`.
- Keep the `Place` type and `buildSkyscannerUrl()` exactly as scoped; keep the
  "Done when" clause that `packages/domain` gains no database dependency.
- Add `pnpm places:generate`: fetch, filter, provenance, row-count sanity check.
- Add the committed curated overlay with the verified 14.
- The unit tests now construct Places as literals rather than reading a list.

**[Issue 07 — Drizzle schema and migrations](../../flight-candidate-tracker/issues/07-schema-and-migrations.md):**

- Replace "ids are app-minted UUIDv7, except Place, keyed by its curated Skyscanner
  identifier" with the table above — the identifier rule survives, the word _curated_
  does not.
- The seed script grows from "loads the curated Places" to "merges generated + curated,
  asserts uniqueness, records provenance, is idempotent".
- "Done when" changes: a fresh clone runs generate + migrate + seed and ends with ~3,244
  places — and **generate now requires network access**, which the previous wording did
  not.
