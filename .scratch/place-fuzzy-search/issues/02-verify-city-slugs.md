# 02 — Verify every curated city slug against Skyscanner

Parent: ../map.md
Type: task
Status: claimed
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

## Working notes — the checklist

Claimed. There was no curated list to verify: `packages/domain` holds only `trip.ts`, so
the list this ticket assumed does not exist yet. The ticket therefore has two halves, and
the first is a **decision for the User**: which multi-airport cities they actually search.
Below is a starter set to trim or extend, weighted toward departures from Taipei.

Only three of these slugs are **observed**; the rest are **derived** by the "metro code +
A" rule, which the parent effort's
[deep-link research](../../flight-candidate-tracker/research/skyscanner-deep-link-format.md)
explicitly marks as community knowledge and not universal — `LOND` is not `LONA`. Expect
some of the derived ones to fail. That is what this ticket exists to find out.

**A page that loads is not a pass.** Skyscanner degrades silently. A slug passes only if
the results page names the intended city _and_ spans more than one of its airports.

| #                                                                                        | City     | Candidate slug | Provenance                            | URL to open                                                                                                                                       | Result |
| ---------------------------------------------------------------------------------------- | -------- | -------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1                                                                                        | Taipei   | `TPEA`         | derived (metro+A) — _unverified_      | [tpea → lhr](https://www.skyscanner.net/transport/flights/tpea/lhr/261215/?adults=1&cabinclass=economy&rtn=0&currency=TWD&locale=en-GB&market=TW) | ☐      |
| 2                                                                                        | Tokyo    | `TYOA`         | derived (metro+A) — _unverified_      | [tyoa → tpe](https://www.skyscanner.net/transport/flights/tyoa/tpe/261215/?adults=1&cabinclass=economy&rtn=0&currency=TWD&locale=en-GB&market=TW) | ☐      |
| 3                                                                                        | Osaka    | `OSAA`         | derived (metro+A) — _unverified_      | [osaa → tpe](https://www.skyscanner.net/transport/flights/osaa/tpe/261215/?adults=1&cabinclass=economy&rtn=0&currency=TWD&locale=en-GB&market=TW) | ☐      |
| 4                                                                                        | Seoul    | `SELA`         | derived (metro+A) — _unverified_      | [sela → tpe](https://www.skyscanner.net/transport/flights/sela/tpe/261215/?adults=1&cabinclass=economy&rtn=0&currency=TWD&locale=en-GB&market=TW) | ☐      |
| 5                                                                                        | Shanghai | `SHAA`         | derived (metro+A) — _unverified_      | [shaa → tpe](https://www.skyscanner.net/transport/flights/shaa/tpe/261215/?adults=1&cabinclass=economy&rtn=0&currency=TWD&locale=en-GB&market=TW) | ☐      |
| 6                                                                                        | Beijing  | `BJSA`         | derived (metro+A) — _unverified_      | [bjsa → tpe](https://www.skyscanner.net/transport/flights/bjsa/tpe/261215/?adults=1&cabinclass=economy&rtn=0&currency=TWD&locale=en-GB&market=TW) | ☐      |
| 7                                                                                        | Bangkok  | `BKKA`         | derived (metro+A) — _unverified_      | [bkka → tpe](https://www.skyscanner.net/transport/flights/bkka/tpe/261215/?adults=1&cabinclass=economy&rtn=0&currency=TWD&locale=en-GB&market=TW) | ☐      |
| 8                                                                                        | London   | `LOND`         | **observed** in a real Skyscanner URL | [lond → tpe](https://www.skyscanner.net/transport/flights/lond/tpe/261215/?adults=1&cabinclass=economy&rtn=0&currency=TWD&locale=en-GB&market=TW) | ☐      |
| 9                                                                                        | New York | `NYCA`         | **observed** in a real Skyscanner URL | [nyca → tpe](https://www.skyscanner.net/transport/flights/nyca/tpe/261215/?adults=1&cabinclass=economy&rtn=0&currency=TWD&locale=en-GB&market=TW) | ☐      |
| 10                                                                                       | Paris    | `PARI`         | derived (metro+A) — _unverified_      | [pari → tpe](https://www.skyscanner.net/transport/flights/pari/tpe/261215/?adults=1&cabinclass=economy&rtn=0&currency=TWD&locale=en-GB&market=TW) | ☐      |
| 11                                                                                       | Milan    | `MILA`         | derived (metro+A) — _unverified_      | [mila → tpe](https://www.skyscanner.net/transport/flights/mila/tpe/261215/?adults=1&cabinclass=economy&rtn=0&currency=TWD&locale=en-GB&market=TW) | ☐      |
| 12                                                                                       | Rome     | `ROMA`         | derived (metro+A) — _unverified_      | [roma → tpe](https://www.skyscanner.net/transport/flights/roma/tpe/261215/?adults=1&cabinclass=economy&rtn=0&currency=TWD&locale=en-GB&market=TW) | ☐      |
| 13                                                                                       | Istanbul | `ISTA`         | **observed** in a real Skyscanner URL | [ista → tpe](https://www.skyscanner.net/transport/flights/ista/tpe/261215/?adults=1&cabinclass=economy&rtn=0&currency=TWD&locale=en-GB&market=TW) | ☐      |
| 14                                                                                       | Jakarta  | `JKTA`         | derived (metro+A) — _unverified_      | [jkta → tpe](https://www.skyscanner.net/transport/flights/jkta/tpe/261215/?adults=1&cabinclass=economy&rtn=0&currency=TWD&locale=en-GB&market=TW) | ☐      |
| Record for each: pass, or fail with what the page actually showed. A failure is not a    |
| dead end — open Skyscanner, search the city by hand, and read the real slug off the URL. |
