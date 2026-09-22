# 06 — Amend the v1 spec

Parent: ../map.md
Type: grilling
Status: resolved
Blocked by: none <!-- 02, 03, 04, 05, 07 resolved -->

## Question

The destination. Fold every decision above into the shipped artifacts so an
implementation agent reads one consistent story.

- **[`spec.md`](../../flight-candidate-tracker/spec.md)**: rewrite the **Places**
  section — the closed hand-curated list becomes a seeded dataset with a curated
  overlay — and the **Creating a Search** section, where "picked from the curated list"
  becomes the search input. Keep the reasoning that survives: the User still cannot type
  a free-form identifier, and why.
- **[`CONTEXT.md`](../../../CONTEXT.md)**: "curated" is currently load-bearing in
  **Place**'s definition and after this it is only half true. Amend it so the verified
  claim attaches to city slugs specifically, without adding a second term.
- **[Issue 06](../../flight-candidate-tracker/issues/06-places-and-deep-link.md)** and
  **[issue 07](../../flight-candidate-tracker/issues/07-schema-and-migrations.md)**:
  apply the edits named in ticket 03. Decide whether the Place input is a seventh slice
  or belongs inside issue 09 (the Search-creation form).
- **ADR**: write the one ticket 03 called for, if it did.
- **Write down the verification ritual.** [02](02-verify-city-slugs.md) found a 45%
  silent-failure rate on derived slugs. Adding a city slug must be documented as: search
  Skyscanner by hand, read the slug off the URL, confirm the results span the city's
  airports. Put it where whoever adds the fifteenth city will find it.
- **Check the invariant**: confirm nothing here slows the logging sweep, and say so.
- Re-triage every touched issue.

## Answer

Applied. Decisions taken in this session:

- **The Place input is its own slice**: [12 — Place search input](../../flight-candidate-tracker/issues/12-place-search-input.md), depending on 07. Issue 09 depends on it. Existing slices keep their numbers.
- **The two-month date picker is in v1** and belongs to issue 09. One-way is an explicit `Save as one-way` action that only saves a Search with no return date. The model is unchanged: there is no stored flag, and round-trip is still derived. The spec's "no toggle" became "no stored flag". It is called a _date picker_, never a "range", so it does not clash with the glossary's "never a range".
- **The verification ritual** goes in the header comment of the curated overlay file (required by issue 06), and the spec's Places section points to it.
- **CONTEXT.md**: in the Place definition, the "curated" claim now covers city slugs only: an open airport dataset plus human-verified city slugs. It is still one term.
- **No new ADR**: ADR 0002 already records the decision; the spec now links it.
- **Invariant checked**: all of this concerns Search creation. The logging sweep is untouched, and the spec now says so.
- **Triage**: 06, 07, 09 and 12 are `ready-for-agent`.

Files touched: `spec.md` (Creating a Search, a new Place search subsection, Places, the header, the slice table), `CONTEXT.md`, and issues 06, 07, 09 and 12 (new).
