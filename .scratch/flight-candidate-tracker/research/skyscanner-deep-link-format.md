# Skyscanner flight deep links: URL shape for exact-date one-way and round-trip

Research date: 2026-09-22. Scope: _generated, human-clickable links only_. No API calls, no scraping, no price retrieval.

## Summary — what to build

There are **two** URL families that produce a Skyscanner flight search for a fixed route and exact dates. They are not equally well documented.

**(A) The officially documented one — the Affiliates Link / Referrals redirect endpoint.** Skyscanner publishes a redirect service whose whole purpose is "construct a URL a human clicks":

```
https://skyscanner.net/g/referrals/v1/flights/day-view/?origin=cdg&destination=edi&outboundDate=2024-12-07&mediaPartnerId=2850210
```

Parameters are ISO dates (`YYYY-MM-DD`), IATA/place codes, `adultsv2`, `childrenv2`, `cabinclass`, `rtn`, `preferDirects`, `market`, `locale`, `currency`. This is documented parameter-by-parameter at developers.skyscanner.net. Its one catch: `mediaPartnerId` is documented as **required** (an impact.com partner ID). For a personal tracker with no affiliate account this is the "correct but gated" option. (Confidence: high — official docs.)

**(B) The de-facto consumer search URL** — the one you get by using the site yourself:

```
https://www.skyscanner.net/transport/flights/{origin}/{destination}/{yymmdd}[/{yymmdd}]/?adults=1&cabinclass=economy&rtn=1
```

Six-digit `yymmdd` dates in the path, return date present = round trip. This is **not published by Skyscanner as an integration contract** — it is observed from the product and very widely reported. (Confidence: medium-high that it works today; low that it is contractually stable.)

**Recommendation for a personal price tracker:** build (B) as the primary link (it is what a human expects and needs no partner account), model it behind one `buildSkyscannerUrl()` seam, validate inputs hard (3-letter code regex, real dates, sane passenger counts), and keep a fallback to `https://www.skyscanner.net/transport/flights/` (plain search page) whenever any input is unknown. Treat (A) as documented evidence for which _parameter names and semantics_ Skyscanner recognises — `rtn`, `cabinclass`, `adultsv2`, `preferDirects`, `market`/`locale`/`currency` are the same vocabulary in both families — and as a drop-in upgrade if you ever get a `mediaPartnerId`.

**Important non-source:** Skyscanner's partner-support pages titled "Deeplinks" are about the _opposite_ direction — how an airline/OTA receives traffic _from_ Skyscanner ([partner support](https://skyscannerpartnersupport.zendesk.com/hc/en-us/articles/115005275369-Deeplinks)). Don't let that vocabulary collision mislead a spec.

---

## 1. Path/slug format for origin and destination

**Three distinct identifier systems exist, and only two of them go in a URL.**

| Kind                                                         | Example                    | Where used                                   | Source                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------ | -------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| IATA **airport** code (3 letters)                            | `lhr`, `jfk`, `cdg`, `edi` | path segment (B); `origin`/`destination` (A) | (a) officially: `origin` / `destination` "requires an IATA code … available for airlines, airports and cities" ([flights-parameters](https://developers.skyscanner.net/docs/referrals/flights-parameters))                                                    |
| Skyscanner **place/city slug** (usually 4 letters, "sky ID") | `lond`, `nyca`, `ista`     | same places as above                         | (b) observed: Skyscanner's own indexed route pages are `https://www.skyscanner.net/routes/lond/ista/london-to-istanbul.html`, titled "Cheap Flights from London (LOND) to Istanbul (ISTA)"; also (a) the official multi-city example uses `destination0=lond` |
| **Entity ID** (numeric, e.g. `27544008`)                     | `27544008`                 | API only — _not_ in clickable search URLs    | (a) [IATA and entity ID](https://developers.skyscanner.net/docs/getting-started/iata-and-entityid), [autosuggest](https://developers.skyscanner.net/docs/autosuggest/overview)                                                                                |

Key points:

- **Yes, 3-letter IATA airport codes are accepted directly in the path.** Officially for the referrals endpoint (a); observed for `/transport/flights/lhr/jfk/…` (b). Skyscanner's own route pages use them (`/routes/jfk/aus/…`, `/routes/stn/svq/…`).
- **Multi-airport cities use a 4-letter Skyscanner slug**, conventionally the IATA metro code plus `A` for "any/all airports": `LOND` (London = IATA metro `LON`), `NYCA` (New York = `NYC`), `ISTA` (Istanbul = `IST`), `PARI` (Paris = `PAR`). The `LOND`/`NYCA`/`ISTA` cases are (b) observed on Skyscanner-hosted URLs and (a) in the official multi-city example; the _general rule_ "metro code + A" is (c) community knowledge — it explains the observed cases but I have not seen Skyscanner state it, and it is not universal (`LOND` is not `LONA`). **Do not derive slugs algorithmically.**
- Country codes also work as an origin in the "browse view" flavour (`origin=fr`, `origin=uk`) — (a) official ([examples](https://developers.skyscanner.net/docs/referrals/examples)).
- Entity IDs solve the genuine ambiguity where a city and one of its airports share a code; Skyscanner recommends them for API work, and requires them for countries (a). Irrelevant to link building.

**What you actually need to know about a place to build a slug:** just its 3-letter IATA airport code, for the airport-level case. For "all airports in city X" you need Skyscanner's own slug, which is **not derivable** — you must look it up. Practical sources, in order of trust:

1. Observe it once in the browser (type the city into Skyscanner, read the URL) and store it in your own small lookup table. This is the honest answer for a personal tracker: a hand-curated table of ~50 city slugs covers everything you'll search.
2. IATA metro codes (from IATA / OpenFlights / OurAirports data) tell you _which_ cities are multi-airport, but give you `LON`, not `LOND`.
3. Skyscanner's Autosuggest/Geo APIs return entity IDs and IATA codes — but that's API usage, out of scope here, and returns entity IDs rather than URL slugs anyway (a).

**Design advice:** model the URL place as a closed union — `{ kind: "airport", iata: string } | { kind: "citySlug", slug: string }` — so the domain model never pretends a slug can be computed from a code.

## 2. Date encoding, and one-way vs round-trip

**Family (A), official:** ISO dates as query params — `outboundDate=2024-12-07`, `inboundDate=2024-12-07`, both `YYYY-MM-DD` (a, [examples](https://developers.skyscanner.net/docs/referrals/examples) / [flights-parameters](https://developers.skyscanner.net/docs/referrals/flights-parameters)). Month-level variants `oym` / `iym` take `YYYY-MM` for calendar views (a). One-way vs return is expressed by **`rtn`: `0` = one-way, `1` = return/multi-city** (a, flights-parameters) — and in practice by simply omitting `inboundDate`.

**Family (B), observed:** dates are **path segments in `yymmdd`** (2-digit year, 2-digit month, 2-digit day, no separators), outbound first, inbound second:

- Round trip: `/transport/flights/lhr/jfk/260315/260322/` → depart 2026-03-15, return 2026-03-22.
- One-way: `/transport/flights/lhr/jfk/260315/` → the return segment is simply **absent**. The distinguishing signal is the missing segment; `rtn=0` is commonly appended as belt-and-braces and is harmless.

Confidence: the `yymmdd` ordering is (b/c) — reported in multiple independent places including a live-format example `https://www.skyscanner.pt/transport/flights/opo/hkg/230114/230122/` (14→22 Jan 2023), and consistent with what the site produces. I could not re-confirm it by loading a page in this session: every direct request to `www.skyscanner.net` was intercepted by Skyscanner's bot-protection captcha (HTTP 307 to `/sttc/px/captcha-v2/…`), which is itself worth knowing (see Reliability). Notably the captcha redirect **echoed my path back base64-encoded unchanged**, i.e. the path was routed, not rejected — but that is not proof the route resolves for a real browser.

The 2-digit year is unambiguous for any realistic tracker horizon (no bookable date is >1 year out in a way that collides).

## 3. Passenger counts and cabin class

Query parameters, never path segments, in both families.

Officially documented (a, [flights-parameters](https://developers.skyscanner.net/docs/referrals/flights-parameters)):

| Param        | Values                                           | Notes                                                                                            |
| ------------ | ------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `adultsv2`   | integer, default `1`                             | passengers aged 18+                                                                              |
| `childrenv2` | **pipe-separated ages**, e.g. `3\|4\|5`          | ages 2–17; the count is implied by the number of ages                                            |
| `children`   | integer                                          | legacy count-only form; the official multi-city example sends **both** `children=2&childrenv2=2` |
| `cabinclass` | `economy`, `premiumeconomy`, `business`, `first` | lowercase, no separators                                                                         |

**Infants:** the referrals docs surface no infant parameter. `infants=<n>` is (c) widely-reported community knowledge for family (B) and is plausible given the legacy `adults`/`children`/`infants` triple, but I have no primary confirmation — treat it as best-effort and never let it be the reason a link fails.

For family (B), the legacy names `adults=1&children=0&infants=0` are (c) the commonly used form and are what older Skyscanner URLs carried; `adultsv2`/`childrenv2` are the newer vocabulary. **Defensive choice: send `adults`/`adultsv2` both, or just `adults=N`, and omit children/infants entirely when zero.** Omitting a zero-valued passenger param is strictly safer than sending it.

Ages: only children carry ages, and only in `childrenv2`'s `a|b|c` form (a). Infant ages are not encoded.

## 4. Currency, locale and market

Three independent query params (a, [localisation](https://developers.skyscanner.net/docs/referrals/localisation)):

- `currency` — ISO 4217, uppercase: `GBP`, `EUR`, `USD`.
- `locale` — language-region: `en-GB`, `en-US`, `de-DE`, `es-ES`, `fr-FR`, `ja-JP`. ~47 "main" locale/market pairs plus ~11 "sibling" locales that replicate content from a main one (e.g. `de-AT` from `de-DE`).
- `market` — country code, **Skyscanner's own spelling, not strictly ISO 3166**: the docs' own examples are `UK`, `US`, `FR`. Note `UK`, not `GB` — this is the classic trap.

Defaults: "If no localisation parameters are set, the system will default to UK settings (`en-GB` locale, `UK` market, `GBP` currency)"; setting only `market` pulls matching defaults for the others. Skyscanner **recommends explicitly setting all three** to avoid surprises (a).

**Hostname vs params:** both exist. Each market/locale combination maps to a specific Skyscanner domain — `www.skyscanner.es` for Spain, `www.skyscanner.com` for the US, `www.skyscanner.net` as the neutral/UK-ish default (a, localisation). Observed (b) in the wild: `www.skyscanner.pt/transport/flights/…`. A `/xx-yy/` **path prefix is (c) community-reported** for some locales; I found no primary documentation for it and would not rely on it. **Simplest defensible rule: pin the host to `www.skyscanner.net` and express everything via `market`/`locale`/`currency` query params.** One host, three params, no domain table to maintain.

## 5. Other commonly-seen params

| Param                                                        | What it does                                                                  | Needed?                                           | Confidence                                                                                                   |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `rtn`                                                        | `0` one-way / `1` return (or multi-city)                                      | optional but cheap and clarifying                 | (a) official                                                                                                 |
| `preferDirects` (seen lowercase `preferdirects` in the wild) | boolean; when true, only direct flights are shown                             | optional                                          | (a) official for the camelCase name; lowercase variant is (c)                                                |
| `sortby`                                                     | `cheapest`, `fastest`, …                                                      | optional                                          | (a)                                                                                                          |
| `airlines`                                                   | comma-separated IATA/ICAO carrier codes                                       | optional                                          | (a)                                                                                                          |
| `alliances`                                                  | `oneworld`, `skyteam`, `staralliance`                                         | optional                                          | (a)                                                                                                          |
| `departure-times`                                            | minutes-from-midnight range, e.g. `0-660`                                     | optional                                          | (a)                                                                                                          |
| `duration`                                                   | max total minutes, e.g. `1320`                                                | optional                                          | (a)                                                                                                          |
| `outboundaltsenabled` / `inboundaltsenabled`                 | toggle the "nearby dates" alternative-date strips                             | not needed                                        | (c) community only — no primary source found; historically `true`/`false`                                    |
| `mediaPartnerId`                                             | impact.com affiliate attribution                                              | **required** for the `/g/referrals/v1/…` endpoint | (a) [quick-start](https://developers.skyscanner.net/docs/referrals/quick-start-guide)                        |
| `utm_term`                                                   | free alphanumeric tracking tag                                                | optional                                          | (a)                                                                                                          |
| `associateId`                                                | older affiliate identifier, still documented for the flight-search **widget** | only if you're an affiliate                       | (a) [widget docs](https://www.partners.skyscanner.net/affiliates/widgets-documentation/flight-search-widget) |
| `ref`                                                        | generic referral tag seen on consumer URLs                                    | not needed                                        | (c)                                                                                                          |

None of the optional filter params are required to get a working search; every one of them is a candidate for being silently ignored after a redesign.

## 6. Worked examples

### One-way, London Heathrow → New York JFK, 15 Mar 2026, 1 adult, economy

```
https://www.skyscanner.net/transport/flights/lhr/jfk/260315/?adults=1&cabinclass=economy&rtn=0&currency=GBP&locale=en-GB&market=UK
└──────── host ────────┘└── fixed ──┘└o┘└d┘└ out ┘  │        │              │     │        │        └ Skyscanner market spelling (UK not GB)
                                       │   │    │    │        │              │     │        └ language-region
                                       │   │    │    │        │              │     └ ISO 4217
                                       │   │    │    │        │              └ 0 = one-way (return segment absent anyway)
                                       │   │    │    │        └ economy|premiumeconomy|business|first
                                       │   │    │    └ adult count
                                       │   │    └ yymmdd outbound; NO second date segment ⇒ one-way
                                       │   └ IATA airport (or city slug e.g. nyca)
                                       └ IATA airport (or city slug e.g. lond)
```

### Round trip, London (all airports) → New York (all airports), 15–22 Mar 2026, 2 adults + 1 child aged 7, economy

```
https://www.skyscanner.net/transport/flights/lond/nyca/260315/260322/?adults=2&children=1&childrenv2=7&cabinclass=economy&rtn=1&currency=GBP&locale=en-GB&market=UK
                                             └──┘ └──┘ └────┘ └────┘           │         │
                                              │    │     │       └ yymmdd inbound ⇒ round trip
                                              │    │     └ yymmdd outbound
                                              │    └ Skyscanner city slug (NOT an IATA code)
                                              └ Skyscanner city slug
                                                                               │         └ pipe-separated child AGES (one age here)
                                                                               └ legacy child COUNT, sent alongside
```

### The officially documented equivalent (needs a mediaPartnerId)

```
https://skyscanner.net/g/referrals/v1/flights/day-view/?origin=lhr&destination=jfk&outboundDate=2026-03-15&inboundDate=2026-03-22&adultsv2=2&childrenv2=7&cabinclass=economy&market=UK&locale=en-GB&currency=GBP&mediaPartnerId=XXXXXXX
```

## 7. TypeScript sketch of a URL builder

```ts
type Place =
  | { kind: "airport"; iata: string } // "LHR" — 3-letter IATA
  | { kind: "citySlug"; slug: string }; // "LOND" — Skyscanner slug, looked up, never derived

type CabinClass = "economy" | "premiumeconomy" | "business" | "first";

interface SearchSpec {
  origin: Place;
  destination: Place;
  outbound: string; // ISO "2026-03-15"
  inbound?: string; // ISO; presence ⇒ round trip
  adults?: number; // default 1
  childAges?: number[]; // 2..17
  infants?: number; // best-effort, undocumented
  cabin?: CabinClass; // default economy
  market?: string; // "UK" (Skyscanner spelling)
  locale?: string; // "en-GB"
  currency?: string; // "GBP"
  directOnly?: boolean;
}

const HOST = "https://www.skyscanner.net";
const FALLBACK = `${HOST}/transport/flights/`; // plain search form

const code = (p: Place) =>
  (p.kind === "airport" ? p.iata : p.slug).toLowerCase();

const yymmdd = (iso: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) throw new RangeError(`bad date: ${iso}`);
  return m[1].slice(2) + m[2] + m[3];
};

export function buildSkyscannerUrl(s: SearchSpec): string {
  try {
    const o = code(s.origin),
      d = code(s.destination);
    // Airports are exactly 3 letters; Skyscanner city slugs are typically 4. Accept 3–4.
    if (!/^[a-z]{3,4}$/.test(o) || !/^[a-z]{3,4}$/.test(d)) return FALLBACK;
    if (o === d) return FALLBACK;

    const dates = [yymmdd(s.outbound), s.inbound ? yymmdd(s.inbound) : null]
      .filter(Boolean)
      .join("/");
    if (s.inbound && s.inbound < s.outbound) return FALLBACK;

    const q = new URLSearchParams();
    q.set("adults", String(Math.min(Math.max(s.adults ?? 1, 1), 8)));
    if (s.childAges?.length) {
      q.set("children", String(s.childAges.length));
      q.set("childrenv2", s.childAges.join("|"));
    }
    if (s.infants) q.set("infants", String(s.infants)); // undocumented; omit when 0
    q.set("cabinclass", s.cabin ?? "economy");
    q.set("rtn", s.inbound ? "1" : "0");
    if (s.directOnly) q.set("preferdirects", "true");
    q.set("market", s.market ?? "UK");
    q.set("locale", s.locale ?? "en-GB");
    q.set("currency", s.currency ?? "GBP");

    return `${HOST}/transport/flights/${o}/${d}/${dates}/?${q}`;
  } catch {
    return FALLBACK; // never hand the user a broken link
  }
}
```

The whole point of the `FALLBACK` returns: a link that lands on Skyscanner's search form is a mild annoyance; a 404 is a bug report.

## Reliability and failure modes

**How official is this?**

- Family (A) `/g/referrals/v1/flights/day-view/` — **officially documented** (a), parameter table and all, and versioned (`v1`) with a public [changelog](https://developers.skyscanner.net/docs/change-log). Gated on `mediaPartnerId`.
- Family (B) `/transport/flights/{o}/{d}/{yymmdd}/{yymmdd}/` — **de-facto**. It is the product's own URL, it is stable enough that it has been in the same shape for the better part of a decade, and Skyscanner's SEO surface uses sibling shapes (`/routes/lond/ista/…`) that they clearly intend to keep indexable. But it is **not a published contract**, so a redesign can change it without notice or deprecation period. Confidence that it works today: medium-high. Confidence that it will work unchanged in 3 years: low-medium.

**Bot protection is real and relevant.** Every direct request I made to `www.skyscanner.net` in this session returned **HTTP 307 to `/sttc/px/captcha-v2/index.html?url=<base64 of my path>`** — PerimeterX-style interception of non-browser clients (observed directly, b). Consequences for a tracker:

- You cannot health-check your generated URLs from a server. Any "does this link work?" automation will see captchas, not answers.
- Real humans in real browsers are not affected.
- This is also the reason I could not directly confirm the rendered result page in this session — treat the `yymmdd` claim as strongly-supported-but-not-personally-verified.

**Failure modes when a part is wrong** (mostly (c), inferred — the captcha prevented direct observation):

| Wrong thing                        | Likely behaviour                                                                                                                                                |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unknown/invalid place code (`zzz`) | Search page loads but the field is unresolved — typically a redirect to the generic flight search form, or a results page that never populates. Not a hard 404. |
| Malformed date segment (`991315`)  | Same: falls back to an empty/prefilled search form rather than erroring.                                                                                        |
| Missing date segments entirely     | Plain search form for that route — this is in fact the safe fallback.                                                                                           |
| Unknown query param                | **Silently ignored.** This is the dangerous one: a filter you think you applied simply isn't.                                                                   |
| Bad `market`/`locale`/`currency`   | Silently falls back to defaults (`en-GB`/`UK`/`GBP`) — documented default behaviour (a).                                                                        |
| Past date                          | Loads, then shows a "no flights"/date-reset state.                                                                                                              |

The recurring theme: **Skyscanner degrades toward a prefilled-but-empty search form rather than erroring.** So the practical risk isn't broken links, it's _silently wrong_ links — a tracker that builds `cabinclass=Business` (wrong case) shows the user economy prices and nobody notices.

**Defensive implementation checklist**

1. Validate before you build: `/^[A-Za-z]{3}$/` for airports, an explicit allow-list for city slugs, real calendar dates, `outbound <= inbound`, passengers in range, cabin class from a closed union (not a string).
2. Lowercase path codes; use exact documented casing for param values (`economy`, not `Economy`).
3. Use `URLSearchParams` — never string-concatenate a query.
4. Omit optional params rather than sending empty or zero values.
5. Always have a fallback URL (`/transport/flights/`) and return it instead of throwing.
6. Keep the builder behind one function with a table-driven test suite of known-good URLs, so a future format change is a one-file fix.
7. Store the _search intent_ (origin, destination, dates, pax, cabin) in your domain model — **never store the built URL as the source of truth.** Rebuild links on render. When the format changes, old data stays valid.
8. Don't automate fetching these URLs. Bot protection will block it, and price retrieval is out of scope anyway.

## Sources

| URL                                                                                                                                                                    | What it supports                                                                                                                                                                                                                                                                                                                            | Type                                 |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| https://developers.skyscanner.net/docs/referrals/quick-start-guide                                                                                                     | Base structure `https://skyscanner.net/g/referrals/v1/{vertical}/{pagetype}`, vertical/page-type table (flights: home, day-view, calendar-month-view, browse-view, multicity, cheap-flights-to, flights-airline), `mediaPartnerId` required, `utm_term` optional                                                                            | (a) official                         |
| https://developers.skyscanner.net/docs/referrals/examples                                                                                                              | Verbatim example URLs for flights day-view / browse-view / multicity; parameter/format table (`outboundDate` YYYY-MM-DD, `adultsv2`, `children`, `childrenv2`, `cabinclass`, `currency`, `locale`, `market`, `departure-times`, `duration`, `alliances`); `destination=lond` showing city slugs accepted; `origin=fr` showing country codes | (a) official                         |
| https://developers.skyscanner.net/docs/referrals/flights-parameters                                                                                                    | Full flights parameter semantics: `origin`/`destination` require IATA codes (airline/airport/city), `inboundDate`, `oym`/`iym` (YYYY-MM), `adultsv2` default 1, `childrenv2` ages 2–17 as `3\|4\|5`, `cabinclass` enum, `preferDirects`, **`rtn` 0 = one-way / 1 = return**, `sortby`, `airlines`, `alliances`                              | (a) official                         |
| https://developers.skyscanner.net/docs/referrals/localisation                                                                                                          | `locale`/`market`/`currency` formats, UK defaults when unset, main vs sibling locales, market→domain mapping                                                                                                                                                                                                                                | (a) official                         |
| https://developers.skyscanner.net/docs/getting-started/iata-and-entityid                                                                                               | IATA vs Skyscanner entity IDs; entity IDs disambiguate city/airport code collisions; required for countries                                                                                                                                                                                                                                 | (a) official                         |
| https://developers.skyscanner.net/docs/autosuggest/overview                                                                                                            | Autosuggest returns `entityId` / `iataCode` / `parentId` (e.g. London `entityId 27544008`, `iataCode LON`)                                                                                                                                                                                                                                  | (a) official                         |
| https://www.partners.skyscanner.net/affiliates/widgets-documentation/flight-search-widget                                                                              | Widget params: `originIataCode`, `destinationIataCode`, `flightOutboundDate`/`flightInboundDate` (YYYY-MM-DD), `flightType`, pax limits, `market` (2-letter), `currency` (3-letter), `associateId`, `locale`, `utmTerm`                                                                                                                     | (a) official                         |
| https://www.skyscanner.net/routes/lond/ista/london-to-istanbul.html                                                                                                    | Skyscanner-hosted route page proving city slugs `LOND`/`ISTA` exist and appear in Skyscanner's own URLs                                                                                                                                                                                                                                     | (b) observed (via indexed title/URL) |
| https://www.skyscanner.net/routes/jfk/aus/new-york-john-f-kennedy-to-austin-bergstrom.html , https://www.skyscanner.net/routes/stn/svq/london-stansted-to-seville.html | Same, for 3-letter IATA airport codes                                                                                                                                                                                                                                                                                                       | (b) observed                         |
| `curl` probes of `https://www.skyscanner.net/transport/flights/...` (this session, 2026-09-22)                                                                         | All requests → HTTP 307 → `/sttc/px/captcha-v2/index.html?url=<base64 path>`; bot protection blocks non-browser verification; path was routed, not rejected                                                                                                                                                                                 | (b) observed directly                |
| https://skyscannerpartnersupport.zendesk.com/hc/en-us/articles/115005275369-Deeplinks                                                                                  | Partner-side ("deeplink" = Skyscanner → airline/OTA) — **explicitly not our URL family**; noted to prevent confusion                                                                                                                                                                                                                        | (a) official, out of scope           |
| `https://www.skyscanner.pt/transport/flights/opo/hkg/230114/230122/` (widely-cited live-format example)                                                                | The `yymmdd` path-date shape and localised host                                                                                                                                                                                                                                                                                             | (c) community / reported             |

Claims marked (c) in this document that a spec author should **not** treat as fact: the `infants=` parameter name, the `outboundaltsenabled`/`inboundaltsenabled` params, the `/xx-yy/` locale path prefix, the "metro code + A" slug-derivation rule, and the exact failure behaviour for malformed segments.
