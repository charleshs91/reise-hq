# 02 — Verify every curated city slug against Skyscanner

Parent: ../map.md
Type: task
Status: resolved
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

| #   | City     | Candidate slug | Provenance                            | URL to open                                                                                                                                       | Result |
| --- | -------- | -------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | Taipei   | `TPET`         | derived (metro+A) — _unverified_      | [tpet → lhr](https://www.skyscanner.net/transport/flights/tpet/lhr/261215/?adults=1&cabinclass=economy&rtn=0&currency=TWD&locale=en-GB&market=TW) | ☐      |
| 2   | Tokyo    | `TYOA`         | derived (metro+A) — _unverified_      | [tyoa → tpe](https://www.skyscanner.net/transport/flights/tyoa/tpe/261215/?adults=1&cabinclass=economy&rtn=0&currency=TWD&locale=en-GB&market=TW) | ☐      |
| 3   | Osaka    | `OSAA`         | derived (metro+A) — _unverified_      | [osaa → tpe](https://www.skyscanner.net/transport/flights/osaa/tpe/261215/?adults=1&cabinclass=economy&rtn=0&currency=TWD&locale=en-GB&market=TW) | ☐      |
| 4   | Seoul    | `SELA`         | derived (metro+A) — _unverified_      | [sela → tpe](https://www.skyscanner.net/transport/flights/sela/tpe/261215/?adults=1&cabinclass=economy&rtn=0&currency=TWD&locale=en-GB&market=TW) | ☐      |
| 5   | Shanghai | `CSHA`         | derived (metro+A) — _unverified_      | [csha → tpe](https://www.skyscanner.net/transport/flights/csha/tpe/261215/?adults=1&cabinclass=economy&rtn=0&currency=TWD&locale=en-GB&market=TW) | ☐      |
| 6   | Beijing  | `BJSA`         | derived (metro+A) — _unverified_      | [bjsa → tpe](https://www.skyscanner.net/transport/flights/bjsa/tpe/261215/?adults=1&cabinclass=economy&rtn=0&currency=TWD&locale=en-GB&market=TW) | ☐      |
| 7   | Bangkok  | `BKKT`         | derived (metro+A) — _unverified_      | [bkkt → tpe](https://www.skyscanner.net/transport/flights/bkkt/tpe/261215/?adults=1&cabinclass=economy&rtn=0&currency=TWD&locale=en-GB&market=TW) | ☐      |
| 8   | London   | `LOND`         | **observed** in a real Skyscanner URL | [lond → tpe](https://www.skyscanner.net/transport/flights/lond/tpe/261215/?adults=1&cabinclass=economy&rtn=0&currency=TWD&locale=en-GB&market=TW) | ☐      |
| 9   | New York | `NYCA`         | **observed** in a real Skyscanner URL | [nyca → tpe](https://www.skyscanner.net/transport/flights/nyca/tpe/261215/?adults=1&cabinclass=economy&rtn=0&currency=TWD&locale=en-GB&market=TW) | ☐      |
| 10  | Paris    | `PARI`         | derived (metro+A) — _unverified_      | [pari → tpe](https://www.skyscanner.net/transport/flights/pari/tpe/261215/?adults=1&cabinclass=economy&rtn=0&currency=TWD&locale=en-GB&market=TW) | ☐      |
| 11  | Milan    | `MILA`         | derived (metro+A) — _unverified_      | [mila → tpe](https://www.skyscanner.net/transport/flights/mila/tpe/261215/?adults=1&cabinclass=economy&rtn=0&currency=TWD&locale=en-GB&market=TW) | ☐      |
| 12  | Rome     | `ROME`         | derived (metro+A) — _unverified_      | [rome → tpe](https://www.skyscanner.net/transport/flights/rome/tpe/261215/?adults=1&cabinclass=economy&rtn=0&currency=TWD&locale=en-GB&market=TW) | ☐      |
| 13  | Istanbul | `ISTA`         | **observed** in a real Skyscanner URL | [ista → tpe](https://www.skyscanner.net/transport/flights/ista/tpe/261215/?adults=1&cabinclass=economy&rtn=0&currency=TWD&locale=en-GB&market=TW) | ☐      |
| 14  | Jakarta  | `CGKI`         | derived (metro+A) — _unverified_      | [cgki → tpe](https://www.skyscanner.net/transport/flights/cgki/tpe/261215/?adults=1&cabinclass=economy&rtn=0&currency=TWD&locale=en-GB&market=TW) | ☐      |

## Answer

**All 14 verified against Skyscanner by the User. Five of the eleven derived slugs were
wrong and have been corrected in the table above.**

| City     | Derived guess | Actual slug |
| -------- | ------------- | ----------- |
| Taipei   | `TPEA`        | **`TPET`**  |
| Shanghai | `SHAA`        | **`CSHA`**  |
| Bangkok  | `BKKA`        | **`BKKT`**  |
| Rome     | `ROMA`        | **`ROME`**  |
| Jakarta  | `JKTA`        | **`CGKI`**  |

### The finding that matters

**The "metro code + A" rule is dead.** It was already marked community knowledge rather
than fact by the [deep-link research](../../flight-candidate-tracker/research/skyscanner-deep-link-format.md);
this ticket buries it. Across the seventeen data points now in hand, the suffix is `A`
(`NYCA`, `TYOA`, `OSAA`, `SELA`, `BJSA`, `PARI`→no, `MILA`), `D` (`LOND`), `T` (`TPET`,
`BKKT`), `E` (`ROME`), `I` (`PARI`, `CGKI`) — and `CSHA` and `CGKI` are not built on the
metro code at all: they prefix or suffix an _airport_ code (`SHA`, `CGK`). There is no
rule. A slug is a fact you read off Skyscanner, one city at a time.

This is a **45% failure rate on derived slugs**, and every failure was silent: the URLs
loaded. That is the domain's headline hazard demonstrated on live data, and it is the
argument for the curated overlay being hand-verified rather than generated — worth
quoting directly in the spec.

### The verified set

Fourteen entries, all confirmed to resolve to the intended city across more than one of
its airports:

`TPET` Taipei · `TYOA` Tokyo · `OSAA` Osaka · `SELA` Seoul · `CSHA` Shanghai ·
`BJSA` Beijing · `BKKT` Bangkok · `LOND` London · `NYCA` New York · `PARI` Paris ·
`MILA` Milan · `ROME` Rome · `ISTA` Istanbul · `CGKI` Jakarta

This is the seed content for the curated overlay file that
[Where Places live and how they are seeded](03-where-places-live.md) specifies the shape
of. The two are complementary: this ticket produced the data, 03 decides where it lives.

### Consequence for future additions

Verification must become a **documented ritual**, not a one-off: adding a city slug means
opening Skyscanner, searching the city by hand, reading the slug off the URL, and
confirming the results span its airports. Nothing about a slug can be computed, checked
by regex beyond its length, or trusted from a third-party dataset — and
[the dataset research](../research/airport-dataset-source.md) already established that no
open dataset carries these at all. [Amend the v1 spec](06-amend-the-v1-spec.md) should
write this ritual down where whoever adds the fifteenth city will find it.
