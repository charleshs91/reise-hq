# 03 — Persistence and stack

Parent: ../map.md
Type: grilling
Status: open
Blocked by: 02

## Question

What backs this data, and how does the web app reach it?

- Postgres (hosted or local) vs SQLite/local file, for a single-user app whose most precious data is an unrecoverable manual price history.
- ORM / query layer, and whether `packages/domain` stays free of any database dependency.
- How the Next.js app talks to it: server actions, route handlers, or a separate service.
- Migrations and the local development story.

If the choice is hard to reverse and the trade-off is real, record it as an ADR under `docs/adr/`.
