---
status: accepted
date: 2026-09-22
---

# SQLite for single-user storage

The flight-candidate tracker is single-user and self-hosted first, and its most
precious data is a hand-typed price history that cannot be re-fetched from
anywhere. We store it in a local SQLite file (`./data/reise.db`, gitignored)
rather than Postgres, because at this size the whole database is a single file
that can be copied as a backup, and there is no concurrency, hosting or
connection-pooling problem for a server to solve.

## Considered options

- **Postgres (local via Docker, hosted later).** Buys concurrency, a hosted
  story and a migration path we would not have to walk twice — but every one of
  those is a solution to a problem v1 does not have, paid for in infrastructure
  on day one.
- **Hosted Postgres from the start (Neon/Supabase).** Survives the laptop, at
  the cost of a network dependency and an account before the first line of the
  app runs.

## Consequences

- Backups are a file copy; a `pnpm db:backup` script exists because "remember to
  copy it" is not a plan for unrecoverable data.
- Migrations are generated SQL applied explicitly (`drizzle-kit generate` +
  `pnpm db:migrate`), never `drizzle-kit push`, which would silently drop
  columns to reconcile a schema — the exact failure mode that would eat the
  price history.
- Ids are UUIDv7 minted in the domain rather than database autoincrement, so
  persistence stays a dumb sink and this choice is not welded into the data.
- This decision assumes single-user, self-hosted. **Revisit when accounts and
  multi-user arrive** — at which point supersede this ADR rather than edit it.
