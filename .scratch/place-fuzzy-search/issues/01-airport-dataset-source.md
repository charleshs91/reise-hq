# 01 — Is OurAirports a viable source for the Place dataset?

Parent: ../map.md
Type: research
Status: resolved
Blocked by: none

## Question

The Place universe is to be bulk-imported from an open airport dataset, filtered to rows
carrying an IATA code and typed `large_airport` or `medium_airport`. Before anything is
specified on top of it, establish the facts:

- **Licence.** Under what terms can OurAirports data be redistributed in a repo? Is
  attribution required, and where would it have to appear?
- **Obtaining it.** Is there a stable URL for the CSV(s)? Which files are needed —
  `airports.csv` alone, or also `countries.csv` / `regions.csv` for display names?
- **Schema.** Exactly which columns give: display name, IATA code, city, country,
  airport type, and whether the row is still operational. Note the column names as they
  actually appear.
- **Counts.** How many rows survive the filter (IATA present, type in
  `large_airport`/`medium_airport`)? Roughly what file size does the filtered set
  become as JSON and as a SQLite table?
- **Quality.** Spot-check for rows with missing or duplicated IATA codes, closed
  airports still typed as active, and obviously wrong city names. Does anything need a
  cleaning pass before it is seedable?
- **Alternatives.** If the licence or quality disqualifies it, what else exists
  (OpenFlights, an IATA-derived dataset) and on what terms?

Capture the findings as a research note under `.scratch/place-fuzzy-search/research/`.

## Answer

**Viable, with no alternative needed.** Full findings: [research note](../research/airport-dataset-source.md)
(commit `87551fb` on `research/airport-dataset-source`).

- **Licence: public domain.** Two agreeing primary sources — ourairports.com/data/ states
  "All data is released to the Public Domain" and "you're not required to" credit; the
  download repo ships the Unlicense. No attribution obligation, no share-alike. A
  courtesy credit is still worth carrying for provenance.
- **Source:** `https://davidmegginson.github.io/ourairports-data/airports.csv` (12.7 MB,
  regenerated nightly) plus `countries.csv` (24 KB) for the country display name, since
  `airports.csv` carries only `iso_country`. `regions.csv` is not needed. The old
  `ourairports.com/data/airports.csv` 301s to the same place.
- **Columns:** display name = `name`, IATA = `iata_code`, city = `municipality`,
  country = `iso_country` joined to `countries.name`, type = `type`. `scheduled_service`
  is the only operational signal — there is no closure date. `keywords` is a ready-made
  alias source (LHR's reads `LON, Londres`), which the fog on aliases can draw on later.
- **Counts:** 86,116 rows → 9,054 with an IATA code → **4,568** after the agreed filter
  (IATA present, type `large_airport`/`medium_airport`).
- **Size:** ~534 KB as minified JSON, ~380 KB as a SQLite table (~604 KB with an FTS5
  index). Commit the generated seed, not the 13 MB CSV.
- **Quality is better than expected:** zero malformed IATA codes, **zero duplicates
  across all 9,054 IATA-bearing rows**, no rows typed `closed` carrying an IATA code, no
  missing names or countries. Four things to handle downstream:
  1. **121 rows have an empty `municipality`** — they need a display fallback and must
     not be dropped.
  2. **1,324 of 4,568 (29%) have `scheduled_service = no`, including 22 typed
     `large_airport`** — İstanbul Atatürk, Boryspil, Kadena Air Base, a not-yet-open
     Western Sydney. Linking to one yields a plausible page for a route nobody flies:
     the headline silent-failure mode in softer form. Requiring `scheduled_service =
'yes'` cuts the set to **3,244**. Raised as a decision on
     [03](03-where-places-live.md).
  3. `type` lags reality: `NLV "Mykolaiv International Airport [CLOSED]"` is still typed
     `medium_airport` — contributors rename before anyone reclassifies.
  4. Upstream data-dictionary bug: it documents `closed_airport`; the CSV uses `closed`.
- **Metro codes are absent at every type** (no LON, NYC, PAR, TYO). This _confirms_ the
  map's decision that multi-airport cities need the hand-curated city-slug overlay — the
  dataset cannot supply them, which is why [02](02-verify-city-slugs.md) exists.
- **Alternatives are worse:** OpenFlights is ODbL + DbCL with explicit share-alike, is
  itself derived from OurAirports, and dates its own contents to January 2017. IATA's
  coding directory is a paid, unredistributable product.

The research agent also flagged that OurAirports contains no _Skyscanner_ identifiers
while the map fixes `Place.id` as one. That is not a gap: the parent effort's
[deep-link research](../../flight-candidate-tracker/research/skyscanner-deep-link-format.md)
established that Skyscanner's consumer URL takes a bare lowercased IATA code for a single
airport — the IATA code _is_ the Skyscanner identifier for `kind: "airport"`. Only city
slugs live in a separate system, which is the whole reason for the curated overlay.
[03](03-where-places-live.md) should restate this plainly in the spec so the next reader
does not trip on it.
