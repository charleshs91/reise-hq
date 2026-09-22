# 05 — Prototype the Place input

Parent: ../map.md
Type: prototype
Status: open
Blocked by: 03, 04

## Question

Ticket 04 of the parent effort settled the core flow by building three variants and
reacting to them; the same applies here. Build the Place input against a real seeded
dataset and find out how it feels before it is specced.

Starting point to react to, not a specification:

- search fires after 2 characters, debounced ~150ms, capped at 10 results
- results are keyboard-navigable (↑/↓/Enter), selection is a single keystroke
- each row shows display name, city, country, and its identifier; a city-slug row is
  visibly "all airports"
- **the form cannot be submitted until a row is selected** — free text never becomes a
  Place
- a selected Place renders as a settled value, not as text left in the box

Open questions the prototype should answer: does the debounce feel right against real
SQLite latency; is the two-kinds distinction legible in a list; what happens to a
selected Place when the User types again; whether the whole Search-creation form (two
Place inputs plus two dates) still reads as the small thing the spec says it is.

Throwaway route under `apps/web/src/app/prototype/`, linked from the answer with its
commit. The answer records which behaviours survive into the spec.
