# 02 — Verify every curated city slug against Skyscanner

Parent: ../map.md
Type: task
Status: open
Blocked by: none

## Question

Nothing to decide — work that unblocks a decision. The whole multi-airport-city half of
this effort rests on the curated city slugs being identifiers Skyscanner actually
accepts, and a wrong one does not error: it returns a plausible page about somewhere
else. Verification cannot be automated without fetching Skyscanner, so a human does it
once, for the dozen-odd entries.

For each curated `{ kind: "citySlug" }` Place:

1. Build a consumer URL for it with `buildSkyscannerUrl()`'s documented format (see the
   parent effort's [research note](../../flight-candidate-tracker/research/skyscanner-deep-link-format.md)),
   using a near-future date.
2. Open it and confirm the results page is for the intended city, and that it spans that
   city's airports rather than one of them.
3. Record the slug, the URL opened, and the outcome.

The agent generates the checklist and the URLs; the human opens them and reports back.

The answer records: the verified set, anything that failed and was dropped or corrected,
and whether the verification step needs to become a documented ritual for future
additions.
