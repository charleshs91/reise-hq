# 05 — Prototype the Place input

Parent: ../map.md
Type: prototype
Status: resolved
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

## Answer

Built four variants of the whole Search-creation form on a throwaway route, over a
**real** scratch SQLite table — 3,258 Places (3,244 OurAirports rows under
[03](03-where-places-live.md)'s filter, exactly its predicted count, plus
[02](02-verify-city-slugs.md)'s 14 hand-verified city slugs) — queried per keystroke
through a Server Action. Captured on branch `prototype/place-input` (commit `c253ebd`),
route `/prototype/place-input?variant=A|B|C|D`.

**Variant C wins: code-first and dense.** One-line rows of `code · name · where`, with
the matched run marked. The three losing variants and what they ruled out:

| Variant | Shape                                   | Why it lost                                                                                                                                        |
| ------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| A       | Roomy two-line combobox                 | The baseline. Legible, but a wall of undifferentiated rows: nothing says why a row is in the list.                                                 |
| B       | Grouped into Cities / Airports sections | Section headers cost two rows out of a ten-row cap to carry what a single word on the row already says. Structure is the wrong tool at this scale. |
| D       | Chip in a field that never collapses    | Solves re-searching, but the answer to "what happens when the User types again" turned out to be cheaper than a persistent chip — see below.       |

### What survives into the spec

- **Dense single-line rows**, identifier first. The code is what the User is really
  choosing; everything else on the row is confirmation.
- **Mark the matched run** in each row. This is the finding A could not deliver: with
  ~3,244 rows a substring rule produces results whose presence is otherwise
  inexplicable (`sa` returning "Abel **Sa**ntamaria"), and marking turns a suspicious
  list into an obvious one. **Mark by weight, colour and underline, never a highlighter
  block** — a background swatch has to be re-tuned for every ground it lands on, which
  is exactly what broke first in dark mode.
- **A selected Place is one click from being re-searched.** The settled field is itself
  the click target, and clearing it focuses the input and opens the list in the same
  gesture. D's persistent chip was built to solve this and proved unnecessary once the
  settled field stopped being inert — the cheaper fix was enough.
- **The selected state must read from fill, not border weight.** A chosen Place styled
  as white-with-a-darker-border is the same object as an empty field at a glance.
- **A real two-month date range picker**, not two `<input type="date">`. Departure and
  return are one decision with one constraint between them; two independent fields
  model them as unrelated and can express a return before its departure. The picker
  previews the range on hover, counts nights, and makes **one-way an explicit choice**
  (`Save as one-way`) rather than an unfilled field.
- **Light and dark as a token swap.** The app's root layout is already dark-aware, and
  the first cut of this prototype hardcoded light surfaces — in dark mode the result
  rows inherited near-white text onto a white panel and the inputs went black. The
  Place input must define its colours as tokens with a dark set, and never hardcode a
  surface colour.

### Latency: the debounce question is answered, and it was not about SQLite

The `LIKE` query runs in **0.2–1.6ms** over the full table — the ranking's five tiers in
TypeScript are free at this size. The whole Server Action round trip is **~34ms in dev**.
So the debounce is not protecting the database from load; it is only deciding how
twitchy the list feels. **150ms was used for the whole session and never got in the
way**; the spec should name it as the starting value and record that the cost of being
wrong is cosmetic, not structural. [03](03-where-places-live.md)'s choice of SQLite
over an in-memory set is confirmed: there was never anything to optimise.

Also confirmed: this touches Search creation only, and the parent map's
_logging-a-price-takes-a-few-seconds_ invariant is untouched.

### What the prototype broke that the rule did not predict

Running [04](04-match-and-ranking-rule.md)'s ranking against the real dataset exposed
**two tier-5 defects that its worked table did not catch**. They are a rule question,
not a UI one, and are now
[Two ranking defects the real dataset exposed](07-tier-5-ranking-defects.md).

### Implementation notes for whoever builds this

- `node:sqlite` returns **null-prototype rows**, which React refuses to serialise across
  a Server Action boundary. Rows must be rebuilt as plain objects before they are
  returned. This cost a debugging cycle here; it should not cost another.
- Diacritic folding worked exactly as [04](04-match-and-ranking-rule.md) specified:
  `zurich` → Zürich Airport, `sao p` → São Paulo/Guarulhos.
