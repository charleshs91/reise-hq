# Map: Flight Candidate Tracker

Label: wayfinder:map

## Destination

A written spec for v1 of the flight-candidate tracker — trips, searches, manually-logged candidates and their price history, plus a generated Skyscanner deep link — backed by a `CONTEXT.md` glossary and any ADRs the decisions warrant, ready to hand to an implementation agent.

## Notes

- Domain: personal travel planning. Single-user, self-hosted first; data modelled as owned by a user so accounts are additive later.
- Repo is scaffolded only: pnpm workspace, `apps/web` (Next.js), `packages/domain` (pure domain, no DB dependency).
- Every session: consult `grilling` and `domain-modeling`. `prototype` for UI-shape tickets, `research` for external-fact tickets.
- Standing preference from the user: **keep v1 as simple as possible**. When in doubt, cut it to fog rather than specify it.
- Planning effort: produce decisions and a spec, not implementation.

## Decisions so far

- Destination and outer scope settled in the charting session: spec-first; per-**Candidate** price history via repeated **PriceObservation**s; a **Trip** contains multiple **Searches**, each with its own deep link; one-way and round-trip only; exact dates only; deep links are generated, never fetched.
- [Skyscanner deep-link URL format](issues/01-skyscanner-deep-link-format.md): use the de-facto consumer URL `/transport/flights/{origin}/{destination}/{yymmdd}[/{yymmdd}]/` behind a single `buildSkyscannerUrl()` seam; one-way is simply the missing second date; pax/cabin/currency/locale are query params; places need a hand-curated lookup (Skyscanner city slugs are not derivable from IATA), and bad input degrades silently rather than 404ing. Full findings: [research note](research/skyscanner-deep-link-format.md).
- [Domain model and glossary](issues/02-domain-model-and-glossary.md): **Trip** is a name-only folder of **Search**es; a Search fixes route, exact dates, currency — and, in v1, one adult in economy as a property of the language rather than fields — so every price under it is comparable by construction. One-way vs round-trip is derived from the presence of a return date. **Place** is a first-class curated term (display name + Skyscanner identifier). **Candidate** is a free-text label plus a required three-valued `stops`; **PriceObservation** is amount + observedAt + optional remark, append-only and never overwritten. **User** is named as owner; no "booked" state in v1. Written up in [`CONTEXT.md`](../../CONTEXT.md).
- [Persistence and stack](issues/03-persistence-and-stack.md): local **SQLite** file (`./data/reise.db`, gitignored, `pnpm db:backup` copies it) — single-user, and the whole database is one copyable file. `packages/domain` stays database-free; a new `packages/db` holds **Drizzle** schema and queries and imports domain, never the reverse. Migrations are generated SQL applied explicitly, never `drizzle-kit push`. The Next app reads via Server Components and writes via Server Actions, with no HTTP API layer. Ids are app-minted UUIDv7, except **Place**, keyed by its curated Skyscanner identifier. Recorded as [ADR 0001](../../docs/adr/0001-sqlite-for-single-user-storage.md).

## Not yet specified

- Whether to adopt the official affiliate referral URL (needs an impact.com `mediaPartnerId`) instead of the consumer URL.
- How the curated **Place** list is sourced, stored and maintained, and how the user picks one when creating a Search.
- How price history is presented and how it supports the buy decision (table only in v1 was the instinct; charts/badges deferred).
- Auth and multi-user: the shape of ownership once it stops being single-user.
- Party size and cabin class: both cut from v1 as fixed (one adult, economy); reopen together when a real multi-passenger or business-class search appears.
- Hosting and deployment of the web app and its database — and, with it, whether the SQLite file moves somewhere that survives the laptop (see [ADR 0001](../../docs/adr/0001-sqlite-for-single-user-storage.md)).
- Deleting semantics: can a Trip, Search or Candidate be removed or archived once it is dead. (Observations are settled: append-only, corrected by appending.)
- What happens to a trip after the flight is bought — terminal state, or just stale data.

## Out of scope

- **Automated price fetching / scraping of Skyscanner** — ToS, anti-bot and scheduling make it its own effort. v1 generates links; humans read the prices.
- **Multi-city trips** — triples the date and deep-link model for a case not asked for.
- **Whole-month / "cheapest month" deep links** — deferred to a later effort; exact dates only for v1.
- **Sharing or collaboration on trips**, **providers other than Skyscanner**, **notifications/alerts**, **import/export** — ruled out to keep v1 small.
