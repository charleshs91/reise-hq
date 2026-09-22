# Research — Is OurAirports a viable source for the Place dataset?

Ticket: [../issues/01-airport-dataset-source.md](../issues/01-airport-dataset-source.md)
Investigated: 2026-09-23. All counts below were measured against the `airports.csv` dump
dated **Sep 22, 2026** (12,728,446 bytes), downloaded and parsed locally — not estimated.

**Verdict: viable, adopt it.** Public domain, stable URLs, clean 3-letter IATA codes with
zero duplicates, 4,568 rows after the filter, ~535 KB as minified JSON / ~380 KB as a SQLite
table. Two small cleaning decisions are needed (missing `municipality`, stale "active" rows);
neither is a blocker.

## Licence

Primary sources:

- [ourairports.com/data/](https://ourairports.com/data/), section "Terms of use":
  > All data is released to the Public Domain, and comes with no guarantee of accuracy or
  > fitness for use.
- The same page, on credit:
  > We'd love you to give us credit, like we give credit to our sources, but you're **not
  > required to**.
- [LICENSE](https://raw.githubusercontent.com/davidmegginson/ourairports-data/main/LICENSE)
  in the download repo: **the Unlicense** ("free and unencumbered software released into the
  public domain… copy, modify, publish, use, compile, sell, or distribute… for any purpose,
  commercial or non-commercial").

**Consequences for this repo:** redistributing the filtered rows (as a seed file, a generated
SQLite table, or committed JSON) is unconditionally permitted. **Attribution is optional.**
Recommend a one-line credit anyway, in whichever of these the dataset lands next to — the
generator script's header comment and a line in `CONTEXT.md` or the seed's README — since it
costs nothing and records provenance for the refresh question the map leaves open.

Note the two disclaimers that _do_ carry: no accuracy guarantee, and (per the map legend /
data dictionary) the data is not suitable for navigation. Irrelevant here — we use it for
names and codes, not for flying.

## Obtaining it

Canonical, stable URLs (the repo README calls these the "Direct download links"):

- `https://davidmegginson.github.io/ourairports-data/airports.csv` — 12,728,446 bytes
- `https://davidmegginson.github.io/ourairports-data/countries.csv` — 24,583 bytes
- `https://davidmegginson.github.io/ourairports-data/regions.csv` — 485,253 bytes

Verified: the historical `https://ourairports.com/data/airports.csv` returns **301** to the
GitHub Pages URL, so either spelling works; prefer the Pages one directly. Effective
3 November 2021 the downloads moved to the repo `davidmegginson/ourairports-data`, regenerated
nightly (per ourairports.com/data/ and the repo README). Cloning the repo is the documented
alternative. All files are UTF-8.

**Which files are needed:**

- `airports.csv` — **required**, carries everything except the country display name.
- `countries.csv` — **required for display**. `airports.csv` gives only `iso_country` ("GB"),
  and the map says country is displayed (never matched), so we need `countries.csv` to turn
  "GB" into "United Kingdom". It is 25 KB; join at generation time and bake the country name
  into the seed rather than shipping a second table.
- `regions.csv` — **not needed**. It resolves `iso_region` ("GB-ENG") to a province/state name.
  Nothing in the spec displays or matches on region; 485 KB for nothing.

## Schema — `airports.csv`

Header line, verbatim from the downloaded file:

```
"id","ident","type","name","latitude_deg","longitude_deg","elevation_ft","continent","iso_country","iso_region","municipality","scheduled_service","icao_code","iata_code","gps_code","local_code","home_link","wikipedia_link","keywords"
```

The columns that matter, with the [data dictionary](https://ourairports.com/help/data-dictionary.html)'s
own definitions:

| Need              | Column              | Notes                                                                                                                                                                                                                                                     |
| ----------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Display name      | `name`              | "The official airport name, including 'Airport', 'Airstrip', etc." e.g. `London Heathrow Airport`.                                                                                                                                                        |
| IATA code         | `iata_code`         | "The three-letter IATA code for the airport (if it has one)." Empty string when absent.                                                                                                                                                                   |
| City              | `municipality`      | "The primary municipality that the airport serves (when available). Note that this is **not** necessarily the municipality where the airport is physically located."                                                                                      |
| Country           | `iso_country`       | ISO 3166-1 alpha-2, plus a few unofficial codes such as `XK` for Kosovo. Foreign key to `countries.csv`.`code`.                                                                                                                                           |
| Airport type      | `type`              | Filter column. See the value-set discrepancy under Quality.                                                                                                                                                                                               |
| Still operational | `scheduled_service` | "'yes' if the airport currently has scheduled airline service; 'no' otherwise." **This is the only operational signal.** There is no closure date, and `type` only says `closed` once a row has been reclassified.                                        |
| (useful extra)    | `keywords`          | "Extra keywords/phrases to assist with search… may include former names, alternate codes, names in other languages, nearby tourist destinations." Sample value for LHR is literally `LON, Londres` — i.e. the alias source the map defers to a later cut. |

`countries.csv` header: `"id","code","name","continent","wikipedia_link","keywords"` — join
`airports.iso_country` → `countries.code`, take `countries.name`.

`regions.csv` header (for the record): `"id","code","local_code","name","continent","iso_country","wikipedia_link","keywords"`.

## Counts

Measured on the Sep 22, 2026 dump:

| Set                                                       | Rows                                   |
| --------------------------------------------------------- | -------------------------------------- |
| All rows in `airports.csv`                                | **86,116**                             |
| Rows with a non-empty `iata_code` (any type)              | 9,054                                  |
| Rows typed `large_airport` or `medium_airport` (any IATA) | 5,280 — 1,174 large + 4,106 medium     |
| **Filtered: IATA present AND type in (large, medium)**    | **4,568 — 1,171 large + 3,397 medium** |
| Dropped by the IATA requirement                           | 712                                    |

Full type distribution of the dump, for context: `small_airport` 42,734, `heliport` 23,220,
`closed` 13,546, `medium_airport` 4,106, `seaplane_base` 1,273, `large_airport` 1,174,
`balloonport` 63.

4,568 is the number to design the picker against. It is two orders of magnitude past the
"few dozen" curated list the map is reacting to, and small enough that substring matching
over it is trivially fast in SQLite.

### Size

Built from the filtered rows with fields `{id, name, city, country, iata, type}`:

| Form                                                           | Bytes             |
| -------------------------------------------------------------- | ----------------- |
| JSON array, `ensure_ascii=false`, default separators           | 601,786 (~588 KB) |
| JSON array, minified separators                                | 546,971 (~534 KB) |
| SQLite table (`place(id PK, name, city, country, iata, type)`) | 389,120 (~380 KB) |
| SQLite table **+ an FTS5 index over name/city/id**, vacuumed   | 618,496 (~604 KB) |

So: about half a megabyte either way, gzipped far less. Size is a non-issue — committing the
generated seed to the repo is entirely reasonable, and the 13 MB source CSV does **not** need
to be committed.

## Quality

Spot-checks run over the 4,568 filtered rows.

**Clean — nothing to fix:**

- **IATA format:** 0 malformed codes. Every one is exactly `[A-Z]{3}`.
- **Duplicate IATA codes:** **0** within the filtered set — and 0 across all 9,054 rows
  carrying an IATA code, at any type. `iata_code` is safe as the natural key for dedupe.
  (It is _not_ the same as `Place.id`, which the map fixes as the Skyscanner identifier —
  see Implications.)
- **Closed airports leaking in:** 0 rows typed `closed` carry an IATA code, so the filter
  cannot pull one in by that route.
- **Missing `name` / `iso_country`:** 0 of each.
- **Nonsense city names:** essentially none. One cosmetic oddity (`YAH` → `La Grande-4`,
  which is a real place). No all-caps or digit-laden junk otherwise.
- Sanity-checked well-known codes: LHR, JFK, LGW, TPE, NRT, HND, CDG, SIN, BER, CGK, EWR all
  present with sensible name/city/country. Decommissioned Berlin airports TXL and SXF are
  correctly **absent** — the dataset does get retired, which is evidence for its upkeep.

**Needs a decision before seeding:**

1. **121 rows have an empty `municipality`.** Examples: `DJO` Daloa Airport (CI), `RUR`
   Rurutu Airport (PF), `TIU` Timaru Airport (NZ), `HKK` Hokitika Airfield (NZ). The picker
   displays and matches on city, so these need a fallback — render the country name in the
   city slot, or omit the slot. They must **not** be dropped; several are the only airport
   serving their island or town.
2. **`scheduled_service = "no"` on 1,324 of the 4,568 rows (29%)**, including **22
   `large_airport` rows**. That list mixes genuinely dormant civil airports (`ISL` İstanbul
   Atatürk — closed to passengers in 2019; `OSM` Mosul; `KBP` Boryspil — closed by the war),
   not-yet-open ones (`WSI` Western Sydney), military/executive fields (`DHA` King Abdulaziz
   Air Base, `DNA` Kadena Air Base, `AZI` Al Bateen), and `LBG` Paris-Le Bourget (business
   aviation only). **Searching for one of these and generating a Skyscanner link for it
   produces a plausible page about a route nobody flies** — a soft version of the exact
   silent-failure mode the map's headline invariant is guarding. Recommend filtering to
   `scheduled_service = 'yes'`, which reduces the seed to **3,244 rows**; or keeping them but
   deranking them. This is a spec decision, not a data defect — flag it back to the map.
3. **One row is closed and says so in its own name but is still typed active:** `NLV`
   "Mykolaiv International Airport **[CLOSED]**", `medium_airport`, `scheduled_service = no`.
   Caught by the `scheduled_service` filter above. It also shows the dataset's failure mode:
   a contributor edits the _name_ before anyone reclassifies the _type_, so `type` alone lags
   reality. A cheap belt-and-braces cleaning rule is to drop rows whose name matches
   `/\[?closed\]?/i`; it currently catches exactly this one row.
4. **Documentation bug in the upstream data dictionary.** It states the allowed `type` values
   include `"closed_airport"`. The actual CSV uses **`closed`** (13,546 rows); the string
   `closed_airport` appears nowhere. Harmless for our filter, which names the two types we
   want positively — but worth knowing before writing any code that enumerates the type set
   from the docs.
5. **No metro/city codes.** `LON`, `NYC`, `PAR`, `TYO` do not exist as rows at any type —
   OurAirports is an airports database, not an IATA location database. This **confirms** the
   map's decision that multi-airport cities stay supported via a hand-curated overlay of city
   slugs; the dataset cannot supply them. (`LON` does appear inside six rows' `keywords`,
   which is an alias hint, not a row.)

Nothing here disqualifies the dataset. The cleaning pass is: join country names, fall back for
empty `municipality`, and decide the `scheduled_service` question.

## Alternatives (not needed, recorded for completeness)

- **OpenFlights** — [openflights.org/data.php](https://openflights.org/data.php). ~10,000
  airports, columns Name / City / Country / IATA / ICAO. **Worse on both axes.** Licence: the
  database is under **ODbL with the Database Contents License**, and the page states you may
  use it "if and only if you both acknowledge the source **and** license any derived works
  made available to the public with a free license as well" — a share-alike obligation
  OurAirports does not impose. And it is downstream anyway: the page says its airport data is
  "derived [from] OurAirports and DAFIF", and `airports.dat` names `OurAirports` as the source
  in its last column. Its data is also stale — the page's own headline count is "as of January
  2017". Strictly worse.
- **An IATA-derived dataset** — IATA's authoritative Airline Coding Directory is a paid,
  licensed commercial product and cannot be redistributed in a public repo. Ruled out on
  licence alone; not investigated further, since OurAirports is public domain and adequate.

## Implications for the spec

- Adopt OurAirports. No licence work, no attribution obligation, no share-alike.
- Fetch `airports.csv` + `countries.csv` from the GitHub Pages URLs; skip `regions.csv`.
- Filter is `iata_code != '' AND type IN ('large_airport','medium_airport')` → 4,568 rows;
  **open question for the map: also require `scheduled_service = 'yes'` → 3,244 rows.**
- The seed carries `name`, `municipality` (with a fallback), `countries.name`, `iata_code`.
  About 380 KB as a SQLite table; commit the generated artefact, not the 13 MB source.
- **Unresolved and out of this ticket's scope:** the map fixes `Place.id` as the _Skyscanner_
  identifier, and OurAirports does not contain Skyscanner identifiers. Something must map
  4,568 IATA codes onto Skyscanner's identifier scheme, or the spec must restate what
  `Place.id` is. This is the one finding that may need a ticket of its own.
- The `keywords` column is a ready-made alias source ("LON, Londres" for LHR) if the deferred
  alias-matching question is ever picked up.

## Reproducing

```sh
curl -O https://davidmegginson.github.io/ourairports-data/airports.csv
curl -O https://davidmegginson.github.io/ourairports-data/countries.csv
python3 -c "
import csv
r=[x for x in csv.DictReader(open('airports.csv',encoding='utf-8'))
   if x['type'] in ('large_airport','medium_airport') and x['iata_code'].strip()]
print(len(r))"
```
