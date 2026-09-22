# 07 — Drizzle schema and migrations

Parent: ../map.md
Spec: ../spec.md
Status: resolved
Depends on: 06

## Goal

The SQLite database exists, matches the domain language, and is seeded with Places.

## Scope

Per [ADR 0001](../../../docs/adr/0001-sqlite-for-single-user-storage.md): a new
`packages/db` holding Drizzle schema and queries, importing `packages/domain` and
never the reverse. Database file at `./data/reise.db`, gitignored.

Tables for **Trip**, **Search**, **Candidate**, **PriceObservation** and **Place**,
following `CONTEXT.md`:

- ids are app-minted UUIDv7, except Place, keyed by its Skyscanner identifier
- Place: `id` (the identifier), `kind` (stored, never derived from string length),
  `name`, nullable `city`, `country`, `type` (large/medium; ranking ties on it), and
  `search_text` (not null: `lower(strip_diacritics(name + ' ' + city + ' ' + id))`,
  generated at seed time — search runs against it, display uses the real columns)
- Trip carries a name and nothing else — no dates, no destination
- Search carries origin and destination Place, departure date, nullable return date,
  and currency. **No one-way flag**: round-trip is derived from the return date.
- Candidate carries a free-text label and a required three-valued `stops`
- PriceObservation carries amount, observedAt and a **nullable `remark` that nothing
  in v1 writes**
- deleting a Candidate cascades to its PriceObservations; nothing else cascades

Migrations are generated SQL applied explicitly — never `drizzle-kit push`. Add the
seed script that merges the generated airports with the curated overlay (overlay
wins), asserts identifier uniqueness, records provenance and is idempotent, and `pnpm db:backup` (a file copy).

## Done when

A fresh clone can run generate + migrate + seed — **generate needs network access** —
and end up with ~3,244 places plus the 14 city slugs, and empty everything else.
