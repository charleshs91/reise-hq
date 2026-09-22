# Map: Place Fuzzy Search

Label: wayfinder:map

## Destination

An **amendment to the shipped v1 spec** of the flight-candidate tracker: `spec.md`, `CONTEXT.md`, implementation issues 06/07 and any ADR it warrants, revised so that picking a **Place** when creating a **Search** is a type-to-search input over a seeded dataset of thousands of airports, rather than a dropdown over a hand-curated list of a few dozen. Landed before v1 is implemented, so the Place picker is built once.

## Notes

- Parent effort: [flight-candidate-tracker](../flight-candidate-tracker/map.md) — its map is resolved and its [spec](../flight-candidate-tracker/spec.md) is `ready-for-agent`. Nothing is built yet.
- Domain: personal travel planning. Single-user, self-hosted. Glossary is [`CONTEXT.md`](../../CONTEXT.md); storage is [ADR 0001](../../docs/adr/0001-sqlite-for-single-user-storage.md).
- Standing preference: **keep v1 as simple as possible**. When in doubt, cut it to fog rather than specify it.
- The invariant everything here leans on: **the User can never type a free-form identifier.** A wrong Skyscanner identifier does not error — it returns a plausible page about somewhere else. Fuzzy search widens the set of pickable Places; it must not open the door to unverified ones.
- The other invariant, from the parent map: **logging a price takes a few seconds.** This effort touches Search creation, not the logging sweep, so it should not be able to regress it — check that assumption before specifying.
- Every session: consult `grilling` and `domain-modeling`. `prototype` for UI-shape tickets, `research` for external-fact tickets.
- Planning effort: produce decisions and an amended spec, not implementation.

## Decisions so far

- Charting session settled the outer shape: the driver is that **the curated list is too small** and adding a Place is a code edit — fuzzy search is the UI, the dataset is the substance. The Place universe becomes a **bulk-imported open airport dataset**, not a live call to Skyscanner's autosuggest (that would reintroduce the Skyscanner dependency v1 ruled out). Matching is **substring, not typo-tolerant**, over name + city + IATA; country is displayed, never matched. Places are **seeded into SQLite** and queried there, not held as a domain constant. **Place stays one term** — the dataset is the set of known Places, not a separate reference type — and `Place.id` remains the Skyscanner identifier itself. Multi-airport cities stay supported via their curated city slugs, which rank above their constituent airports. The amendment lands in v1 rather than as a v1.1.
- [Is OurAirports a viable source for the Place dataset?](issues/01-airport-dataset-source.md): **yes, public domain** (Unlicense; no attribution required). `airports.csv` + `countries.csv` from `davidmegginson.github.io/ourairports-data`, nightly. The agreed filter (IATA present, type large/medium) leaves **4,568 rows, ~534 KB as JSON / ~380 KB as a SQLite table** — small enough to commit the generated seed rather than the 13 MB CSV. Quality is high: **zero duplicate IATA codes** anywhere in the source. Two things the dataset cannot do: it carries **no metro codes at all** (confirming the curated city-slug overlay is load-bearing, not a convenience), and 29% of the filtered rows have `scheduled_service = no`, which is a live filter decision on [03](issues/03-where-places-live.md). OpenFlights is share-alike, derived, and stale; IATA's directory is paid. Full findings: [research note](research/airport-dataset-source.md).

- [Verify every curated city slug against Skyscanner](issues/02-verify-city-slugs.md): all 14 candidate cities verified by hand; **5 of the 11 derived slugs were wrong** (`TPET` not `TPEA`, `CSHA` not `SHAA`, `BKKT` not `BKKA`, `ROME` not `ROMA`, `CGKI` not `JKTA`), and every wrong one **loaded a plausible page rather than erroring**. The "metro code + A" rule is now definitively dead — `CSHA` and `CGKI` are not even built on the metro code — so a city slug is a fact read off Skyscanner, never computed. Produced the verified 14-entry seed set for the curated overlay, and the requirement that adding a city be a documented verification ritual.

- [Where Places live and how they are seeded](issues/03-where-places-live.md): a seeded `places` table in `packages/db` — `id` (the Skyscanner identifier), `kind` (stored, never derived from string length), `name`, nullable `city`, `country`, `type`. The filter gains **`scheduled_service = 'yes'`**, cutting to ~3,244 rows and dropping 22 large airports that no longer take scheduled traffic. The generated seed is **built at seed time, not committed** — so seeding needs network, and the seed records provenance, caches downloads, stays idempotent and fails loudly on an implausible row count. A committed curated overlay holds the verified 14 slugs and always wins the merge. `packages/domain` keeps the `Place` type and `buildSkyscannerUrl()` and no Place data at all. Recorded as [ADR 0002](../../docs/adr/0002-places-seeded-from-an-open-dataset.md), amending ADR 0001.

- [The match and ranking rule](issues/04-match-and-ranking-rule.md): matching folds diacritics into a new **`search_text`** column (`lower(strip_diacritics(name + city + id))`) generated at seed time — the dataset's _English_ names are spelled `Zürich`, `São Paulo`, `İstanbul`, so without it `zurich` silently returns nothing. Ranking is **five tiers** — exact id, city-slug city prefix, airport city prefix, airport name prefix, any remaining substring — with ties broken by **`type` (large before medium)** then alphabetically, so **`03`'s `type` column survives**. A city slug outranks its own airports only when the _city_ was typed: "Heathrow" does not surface "London — all airports" at all. IATA matches by **prefix, never infix** (`la` must not hit `GLA`). Minimum 2 characters, cap 10 with a "showing 10 of 240" notice; a **Server Action per keystroke against SQLite**, one `LIKE` fetch with the **ranking as a pure, unit-tested TypeScript function** — the spec names the rule and a query→expected-results table, not the SQL. Empty state is "No matching airport or city — try the airport code", and free text is blocked structurally at three layers: no form value, submit disabled, server rejects an unknown `placeId`.

- [Prototype the Place input](issues/05-place-input-prototype.md): built four variants over a **real** 3,258-row scratch SQLite table; **the dense, code-first one wins**. What survives: single-line rows with the identifier first, **the matched run marked** (by weight and colour, never a highlighter block — that is what broke first in dark mode), a settled Place that is itself the click target back into search, selected state read from **fill rather than border weight**, a **two-month range picker** replacing two `<input type="date">` with one-way as an explicit choice, and **light/dark as a token swap**. On latency: the `LIKE` query runs in **0.2–1.6ms** and the whole round trip in **~34ms**, so the debounce is a feel decision, not a load one — **150ms** never got in the way. Two implementation traps recorded: `node:sqlite` returns null-prototype rows React refuses to serialise, and the app's root layout is already dark-aware.

## Not yet specified

- Refreshing the dataset over time. Sharper now that the seed is built rather than committed: two clones seeded on different days hold different Place sets, and re-seeding is the moment a Search could point at a Place that has left the dataset. v1 seeds once and never refreshes, so this is real but not yet live — [ADR 0002](../../docs/adr/0002-places-seeded-from-an-open-dataset.md) names it as the revisit trigger.
- Typo tolerance and alias matching ("Nueva York", "Heathrow" reaching London). Deliberately not in the first cut; revisit if substring matching turns out to miss things in real use. Sharper after 04: diacritics are handled, so what remains is genuine misspelling and alternate names, not spelling systems.
- Aliases are cheaper than expected: OurAirports ships a `keywords` column that already holds them (LHR's reads `LON, Londres`). If substring matching misses things in real use, that column is the first thing to reach for.
- Recently-used or favourite Places surfacing above search results, once there is real usage to say whether it helps.
- A query that is a real IATA code we filtered out (`ISL` İstanbul Atatürk, and the other 1,324 `scheduled_service = no` rows) gets the same blank empty state as a typo. Telling those apart means seeding the excluded rows to apologise for them; revisit only if someone actually hits it.
- Non-airport origins and destinations (rail stations, bus). Skyscanner has them; whether this model should is untouched.
- Whether the curated overlay ever needs an in-app editing surface, or stays a code edit forever.
- How the Place input behaves on a phone. The prototype was judged at desk width; the
  winning variant's dense single-line rows are the part most likely to need a second
  look on a narrow screen. Not sharp enough to ticket until someone tries it.

## Out of scope

- **Skyscanner's autosuggest / places API.** Ruled out with the parent map's no-fetching boundary: an undocumented endpoint, a live third-party dependency at type time, and its own anti-bot question. v1 generates links; it does not call Skyscanner.
- **A typo-tolerant fuzzy library** (Fuse.js and friends) for this cut. Typo tolerance on 3-letter airport codes produces confidently wrong matches — the exact silent-failure mode this domain punishes.
- **Anything in the parent map's Out of scope section** — automated price fetching, multi-city, whole-month links, sharing, other providers, notifications, import/export — unchanged.
