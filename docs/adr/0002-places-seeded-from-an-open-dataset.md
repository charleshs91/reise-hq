---
status: accepted
date: 2026-09-23
amends: 0001-sqlite-for-single-user-storage
---

# Places are seeded from an open dataset, not hand-curated

v1 modelled the set of **Place**s as a hand-curated list of a few dozen entries,
checked into `packages/domain`. Adding a Place was a code edit. That was a
deliberate trade — a wrong Skyscanner identifier does not error, it returns a
plausible page about somewhere else, so every identifier was one a human had
verified — but it made the tracker unusable for any route its author had not
thought of in advance.

The Place set is now **seeded into SQLite from OurAirports** (public domain,
Unlicense), filtered to rows carrying an IATA code, typed `large_airport` or
`medium_airport`, and marked `scheduled_service = yes`: roughly 3,244 rows. A
small **curated overlay**, committed and hand-verified, is merged over it.

The verification discipline survives where it is load-bearing and is dropped
where it is not. For a single airport, the IATA code _is_ the Skyscanner
identifier, so an imported row is as trustworthy as a typed one. Skyscanner's
**city slugs** for multi-airport cities are a separate proprietary system that no
open dataset carries, and they remain hand-verified — the overlay's real job.

## Considered options

- **Keep the hand-curated list.** No new failure modes, but the friction that
  motivated the change stays, and the list can only ever cover routes already
  imagined.
- **Query Skyscanner's autosuggest API at type time.** Always current and no seed
  at all, but it reintroduces the live Skyscanner dependency v1 explicitly ruled
  out, against an undocumented endpoint with its own anti-bot question.
- **Commit the generated seed file.** A reproducible clone and no network at
  install, for ~534 KB of JSON in git history. Rejected: the repo stays free of
  generated blobs, at the cost of the consequences below.

## Consequences

- **Seeding requires network access.** `pnpm places:generate` fetches the CSVs;
  `pnpm db:seed` merges and loads. A fresh clone cannot be seeded offline.
- **Upstream is regenerated nightly, so two clones seeded on different days hold
  different Place sets.** The seed therefore records its provenance — source URL,
  fetch date, post-filter row count — because an undiagnosable difference between
  two installs is the failure mode this invites. Downloads are cached to a
  gitignored directory, the seed is idempotent, and an implausible row count
  fails the seed rather than truncating a good table.
- `packages/domain` holds no Place _data_ — only the `Place` type and
  `buildSkyscannerUrl()`. Its tests construct Places as literals, so the URL
  builder no longer depends on what happens to be in a list.
- **Derivation is banned.** Verifying the candidate slugs found 5 of 11 derived
  guesses wrong (`TPET` not `TPEA`, `CSHA` not `SHAA`, `BKKT` not `BKKA`, `ROME`
  not `ROMA`, `CGKI` not `JKTA`), and every wrong one rendered a page rather than
  erroring. Adding a city slug is a documented manual ritual: search Skyscanner,
  read the slug off the URL, confirm the results span the city's airports.
- ADR 0001's rule that Place is keyed by its Skyscanner identifier is unchanged.
  Only the word _curated_ in it no longer describes where the rows come from.
- **Revisit when** a Search can point at a Place that a later seed has dropped.
  v1 seeds once and does not refresh, so the question is real but not yet live.
