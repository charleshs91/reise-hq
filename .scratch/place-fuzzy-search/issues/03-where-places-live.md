# 03 — Where Places live and how they are seeded

Parent: ../map.md
Type: grilling
Status: open
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
