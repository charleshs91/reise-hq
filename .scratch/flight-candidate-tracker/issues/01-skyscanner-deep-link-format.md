# 01 — Skyscanner deep-link URL format

Parent: ../map.md
Type: research
Status: resolved

## Question

What exactly does a Skyscanner flight-search URL look like for an exact-date one-way and round-trip search, and which parts of it can we construct reliably?

Specifically:

- The path/slug format for origin and destination — IATA codes, Skyscanner place slugs, or both? What do we need to know about an airport or city to build one?
- The date encoding for one-way and for round-trip.
- Passenger counts (adults/children/infants) and cabin class — path segments or query parameters?
- Currency, locale and market parameters.
- Whether a constructed URL of this shape is stable enough to rely on, and what the failure mode looks like if a part is wrong.

Out of scope for this ticket: any API, scraping, or automated price retrieval.

Record findings as a markdown file under `.scratch/flight-candidate-tracker/research/` and link it from the Answer.

## Answer

Findings: [`../research/skyscanner-deep-link-format.md`](../research/skyscanner-deep-link-format.md)

There are two URL families, and only one of them is officially documented.

- **(A) Referrals/affiliate redirect endpoint** — `https://skyscanner.net/g/referrals/v1/flights/day-view/?origin=cdg&destination=edi&outboundDate=2024-12-07&…`. Fully documented parameter-by-parameter at developers.skyscanner.net: ISO `YYYY-MM-DD` dates, `adultsv2`, `childrenv2` (ages, `3|4|5`), `cabinclass=economy|premiumeconomy|business|first`, `rtn=0|1`, `preferDirects`, `market`/`locale`/`currency`. Catch: `mediaPartnerId` is **required**, i.e. it needs an affiliate account.
- **(B) The consumer search URL** — `https://www.skyscanner.net/transport/flights/{origin}/{destination}/{yymmdd}[/{yymmdd}]/?adults=1&cabinclass=economy&rtn=1`. Dates are 6-digit `yymmdd` path segments, outbound then inbound; **presence of the second date segment is what makes it a round trip**. This shape is observed and widely reported but is _not_ published by Skyscanner as an integration contract.

Answers to the specific questions:

- **Origin/destination slugs**: 3-letter lowercase IATA airport codes work directly (`lhr`, `jfk`). Multi-airport cities use a 4-letter Skyscanner place slug (`lond`, `nyca`, `ista`, `pari`) that is **not algorithmically derivable** from the IATA metro code — it must be looked up and stored. Numeric entity IDs are API-only and never appear in clickable URLs. Recommendation: model place as a closed union `{kind:"airport",iata} | {kind:"citySlug",slug}` and hand-curate a small slug table.
- **Dates**: (A) ISO `YYYY-MM-DD` query params; (B) `yymmdd` path segments. One-way = omit the inbound segment (plus `rtn=0` where the param is honoured).
- **Passengers / cabin**: query parameters, not path segments. `adults`, `children`, `infants` on (B); `adultsv2`, `childrenv2` (comma-free ages, pipe-separated) on (A). `cabinclass` takes `economy|premiumeconomy|business|first` in both. The `infants=` name on (B) is community-reported, not verified.
- **Currency / locale / market**: `currency` (ISO 4217), `locale` (`en-GB` style), `market` (2-letter country — Skyscanner uses `UK`, not `GB`) as query params on both families; market also maps to a localised host (`skyscanner.de`, `skyscanner.pt`). Defaults to UK when unset.
- **Reliability**: family (B) is de-facto, so treat it as unstable. Direct verification in this session was blocked by bot protection — every `curl` to `/transport/flights/...` returned a 307 to a captcha page, which confirms the path is _routed_ but does not confirm rendering. Defensive posture: put it behind a single `buildSkyscannerUrl()` seam, validate inputs hard (3-letter code regex, real dates, sane pax counts), and fall back to the plain `https://www.skyscanner.net/transport/flights/` search page whenever any input is unknown.

The research file flags which claims are official (a), directly observed (b), and community folklore (c) — notably the `infants=` param name, the `outboundaltsenabled`/`inboundaltsenabled` params, the `/xx-yy/` locale path prefix and the "metro code + A" slug rule are all (c) and should not be treated as fact by the spec.
