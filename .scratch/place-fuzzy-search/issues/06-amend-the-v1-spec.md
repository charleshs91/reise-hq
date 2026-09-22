# 06 — Amend the v1 spec

Parent: ../map.md
Type: grilling
Status: open
Blocked by: 03, 04, 05 <!-- 02 resolved -->

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
