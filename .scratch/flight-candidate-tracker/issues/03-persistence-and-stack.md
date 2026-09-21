# 03 — Persistence and stack

Parent: ../map.md
Type: grilling
Status: resolved
Blocked by: 02 (resolved)

## Question

What backs this data, and how does the web app reach it?

- Postgres (hosted or local) vs SQLite/local file, for a single-user app whose most precious data is an unrecoverable manual price history.
- ORM / query layer, and whether `packages/domain` stays free of any database dependency.
- How the Next.js app talks to it: server actions, route handlers, or a separate service.
- Migrations and the local development story.

If the choice is hard to reverse and the trade-off is real, record it as an ADR under `docs/adr/`.

## Answer

**SQLite, a pure domain, Drizzle, and no API layer.**

- **Store**: local SQLite file at `./data/reise.db`, gitignored. Single-user, tiny
  data, and backup is a file copy — plus a `pnpm db:backup` script that copies it
  with a timestamp, because the price history is unrecoverable. Hosting stays fog.
- **Domain purity**: `packages/domain` stays free of any database dependency —
  types and pure functions (`buildSkyscannerUrl`, the one-way/round-trip
  derivation). Persistence lives in a new `packages/db` that imports `domain`,
  never the reverse.
- **Query layer**: Drizzle. Schema-as-TypeScript beside the hand-written domain
  model, migrations as readable checked-in SQL, no codegen step or query engine
  to carry for ~5 tables.
- **Migrations**: `drizzle-kit generate` into checked-in SQL, applied by an
  explicit `pnpm db:migrate`. Never `drizzle-kit push` — it drops columns
  silently to reconcile a schema, which is exactly what would eat an append-only
  price history.
- **App → DB**: Server Components read, Server Actions write, importing
  `packages/db` directly. No `/api/*` layer: single user, same process, no second
  consumer. Route handlers stay additive if a mobile client ever appears.
- **Ids**: UUIDv7 minted in the domain, not database autoincrement — keeps
  `packages/db` a dumb sink and makes a future move off SQLite non-eventful; they
  sort by creation time, so `PriceObservation` ordering is free. **Place** is the
  exception: its curated Skyscanner identifier is its natural key, no separate id.

Recorded as [ADR 0001 — SQLite for single-user storage](../../../docs/adr/0001-sqlite-for-single-user-storage.md),
explicitly scoped to single-user/self-hosted and to be superseded, not edited,
when accounts arrive. The other choices here are cheap to reverse or unsurprising,
so they belong in the v1 spec rather than in `docs/adr/`.
