# 05 — Assemble the v1 spec

Parent: ../map.md
Type: grilling
Status: resolved
Blocked by: 02 (resolved), 03, 04

## Question

Cut v1 to its smallest honest shape and write the spec.

- What is the minimum set of screens and actions?
- What is deliberately left out, and where does it go (fog, or out of scope)?
- Slice the spec into implementation issues under `.scratch/flight-candidate-tracker/issues/`, triaged per `docs/agents/triage-labels.md`.

This is the destination: when this closes, the map is done.

## Answer

**v1 is two screens, and the spec is written: [`spec.md`](../spec.md).**

The cut, decision by decision:

- **Two screens, no others.** Trip list (name + next departure date, computed on read) and trip page (the Trip's Searches with their generated links, Candidates as rows). Carried over from ticket 04.
- **Places**: one curated, checked-in closed list, seeded into the database; entries are `{kind:"airport",iata}` or `{kind:"citySlug",slug}`. No admin screen, no free-form code entry. IATA codes do work directly in a Skyscanner path, so the list is not there to make URLs resolve — it is there because a wrong identifier degrades silently into a plausible wrong results page, so every identifier is one a human verified.
- **Currency, locale, market**: app-wide config constants. Currency is still stored on each Search (the model earned it); it is just never asked for.
- **Remark**: stays in the model and the schema, with nothing in v1 writing it. It arrives with the candidate detail page. Cutting it would discard a term the model earned; surfacing it would fight the one finding of ticket 04.
- **Deleting**: a Candidate only, confirmed, cascading to its observations. Trips and Searches are not deletable in v1; archiving stays fog. This is a real tension with append-only, so `CONTEXT.md` now names it as the single exception rather than leaving the invariant quietly broken.
- **Candidate row** shows latest price plus delta against the previous observation — the buy decision is "cheaper than last time", and the full history is the detail page's job.

`CONTEXT.md` was amended twice: **Place** gained the two-kinds distinction, and **PriceObservation** gained the one-way-history-dies clause. No new terms.

Sliced into six vertical implementation issues, each ending in something usable, all `ready-for-agent`: [06 Places + deep link](06-places-and-deep-link.md), [07 schema + migrations](07-schema-and-migrations.md), [08 trip list](08-trip-list.md), [09 trip page + Searches](09-trip-page-searches.md), [10 candidate rows + logging sweep](10-candidate-rows-and-logging.md), [11 latest price + delete](11-latest-price-and-delete.md).
