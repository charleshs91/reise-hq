# 12 — Place search input

Parent: ../map.md
Spec: ../spec.md
Status: ready-for-agent
Depends on: 07

## Goal

The User can find any known Place by typing part of its name, city or code, and the
input yields only a real Place id — never free text.

## Scope

- **Ranking** as a pure TypeScript function over candidate rows: the six tiers and the
  tie-break (city slug, then large before medium, then name) from
  [Two ranking defects the real dataset exposed](../../place-fuzzy-search/issues/07-tier-5-ranking-defects.md).
  Identifiers match by prefix only, never infix.
- A **Server Action** per keystroke (150ms debounce): fold the query's diacritics, run
  one `LIKE` over `places.search_text`, rank, return at most 10 plus the total count.
  Minimum 2 characters.
- The **input component**, following the winning variant of
  [Prototype the Place input](../../place-fuzzy-search/issues/05-place-input-prototype.md):
  single-line rows with the identifier first, the matched run marked by weight and
  colour (never a highlighter block), country shown, "showing 10 of N" when capped,
  empty state "No matching airport or city — try the airport code", the settled Place
  as the click target back into search, colours as tokens with a dark set.
- **Free text blocked at three layers**: no form value until a result is picked; the
  consuming form's submit disabled without it; the server rejects any `placeId` not
  in `places`.

Traps from the prototype: `node:sqlite` returns null-prototype rows React will not
serialise — spread them into plain objects; the root layout is already dark-aware.

## Done when

- The ranking function passes the query→expected-results table in the ranking ticket,
  against a small hand-built fixture, not the live dataset.
- A request with an unknown `placeId` is rejected server-side.
- `zurich`, `heathrow` and `london` behave as the table says in the running app.
