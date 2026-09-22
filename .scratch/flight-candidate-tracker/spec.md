# Spec: Flight Candidate Tracker v1

Status: ready for implementation
Map: [map.md](map.md) · Glossary: [`CONTEXT.md`](../../CONTEXT.md) · [ADR 0001](../../docs/adr/0001-sqlite-for-single-user-storage.md) · [ADR 0002](../../docs/adr/0002-places-seeded-from-an-open-dataset.md)
Amended by: [Place Fuzzy Search](../place-fuzzy-search/map.md) — Places are a searchable seeded dataset; dates use a date picker

## What this is

A single-user, self-hosted tracker for the manual part of shopping for a flight.
The User searches on Skyscanner by hand, and logs what they saw: a **Candidate**
(a flight option, loosely identified) and a **PriceObservation** (what it cost
just now). Over days or weeks the price history accumulates, and the User reads it
to decide when to buy.

The system never fetches a price. It generates the Skyscanner deep link and gets
out of the way. Everything it stores was typed by a human.

All domain terms below are defined in [`CONTEXT.md`](../../CONTEXT.md) and are not
redefined here.

## The one thing that must be true

**Logging a price takes a few seconds.** Ticket 04 established this by prototype:
if logging is a destination you navigate to, the history never gets filled and the
product has no point. Every decision below is downstream of it. A change that
makes the logging sweep slower is a regression, however much else it improves.

The sweep is: open the trip page, open the Skyscanner links, then tab down the
candidate rows typing price-Enter-price-Enter.

## Screens

v1 has two screens and no others. There is no Search page and no Candidate page.

### 1. Trip list (`/`)

The landing page. Every Trip, as a row: its **name**, and the **next departure
date** across its Searches — the earliest departure date not in the past, or
nothing if it has no Searches or they have all passed. The date is read off the
Searches; it is never stored on the Trip.

Actions: create a Trip (name only), open a Trip.

### 2. Trip page (`/trips/:id`)

One Trip's whole shelf. All of its Searches, and under each, all of its
Candidates. Nothing here navigates away except the Skyscanner links.

Per **Search**, a header showing origin → destination, departure date, return date
if round-trip, and the **generated Skyscanner link**, opening in a new tab.

Per **Candidate**, a row:

- the **label** (free text)
- the **stops** value as three single-selection chips (`direct` / `one-stop` /
  `two-plus`), all three visible, selecting one is a single tap
- a **price box**: an always-live number input. Typing an amount and pressing
  Enter records a PriceObservation at the current time and clears the box. No
  save button, no dialog, no navigation.
- the **latest price** and its **delta** against the immediately previous
  observation (direction and magnitude; nothing if there is only one). This is
  the whole of the history shown in v1.
- a **delete** control (see Deleting)

At the end of each Search's rows, a **new-candidate row**: label, stops chips, and
a price box. Filling it creates the Candidate and its first PriceObservation as a
single act. A Candidate cannot be created without a first price.

Actions: create a Search within the Trip, create a Candidate with its first price,
log a price on an existing Candidate, delete a Candidate.

## Creating a Search

Origin **Place**, destination Place, departure date, optional return date. That is
the entire form.

Each Place is chosen with a **type-to-search input** over the known Places (see
Places). The User types, picks a result, and the input settles on that Place; the
settled Place is itself the click target back into search. Only a picked Place is a
value — see "Free text is blocked" below.

Dates are chosen with a single **two-month date picker**, not two independent date
fields: departure and return are one decision with one constraint between them. It
previews the span on hover and counts nights. Dates are still exact — the picker
picks two exact days, never a flexible window. **One-way is an explicit action in
the picker** (`Save as one-way`), which saves the Search with no return date. There
is still **no stored one-way/round-trip flag**: round-trip is derived from the
return date's presence.

The Search's **currency** is populated from app config at creation and is not
asked for.

Validation: both Places required, departure date required, return date (if given)
not before the departure date.

This whole form is Search creation, not the logging sweep: nothing here touches the
trip page's candidate rows, so the one thing that must be true is unaffected.

### Place search

- Matching is **substring, not typo-tolerant**, against a diacritic-folded text of
  name + city + identifier (`zurich` finds `Zürich`). Country is displayed, never
  matched. An identifier matches by **prefix only**, never infix (`la` never hits
  `GLA`).
- Minimum 2 characters; at most 10 results, with a "showing 10 of N" notice.
- **Ranking** is six tiers — exact identifier; city-slug city prefix; airport city
  prefix; airport name prefix; identifier prefix; any remaining substring — ties
  broken by city slug first, then large before medium airport, then name. A city
  slug appears only when its _city_ was typed ("Heathrow" does not surface "London —
  all airports"). The rule and its tested query table live in
  [Two ranking defects the real dataset exposed](../../place-fuzzy-search/issues/07-tier-5-ranking-defects.md).
- Empty state: "No matching airport or city — try the airport code".
- Each keystroke (debounced 150ms) calls a Server Action that runs one `LIKE` query
  against SQLite; the ranking is a pure, unit-tested TypeScript function over its rows.

**Free text is blocked** at three layers: the input holds no form value until a
result is picked, submit is disabled without both Places, and the server rejects any
`placeId` not in the `places` table.

Visual direction is the winning variant of
[Prototype the Place input](../../place-fuzzy-search/issues/05-place-input-prototype.md): dense
single-line rows with the identifier first, the matched run marked by weight and
colour, selected state shown by fill, and colours as tokens with a dark set.

## Places

The known Places are **seeded into SQLite** from two sources
([ADR 0002](../../docs/adr/0002-places-seeded-from-an-open-dataset.md)):

1. **Generated airports** — built at seed time from
   [OurAirports](https://ourairports.com/data/) (public domain), filtered to rows with
   an IATA code, type large or medium, and scheduled service: ~3,244 airports. Not
   committed; generating needs network, caches its downloads, records provenance, and
   fails loudly on an implausible row count.
2. **Curated overlay** — committed, holding the 14 verified **city slugs** for
   multi-airport cities (and any airport override). It always wins the merge.

The User still **cannot type a free-form identifier**. This is deliberate: the
failure mode of a wrong Skyscanner identifier is a plausible-looking wrong results
page, not an error. Search widens which Places can be picked; it never admits an
unverified one.

Each Place has a display name and one of two kinds of identifier:

- `{ kind: "airport", iata }` — a 3-letter IATA airport code (`LHR`, `JFK`)
- `{ kind: "citySlug", slug }` — a Skyscanner city slug for a multi-airport city
  (`LOND`, `NYCA`)

**A city slug is never derived from an IATA code.** The "metro code + A" pattern is
dead: five of eleven derived slugs were wrong, and every wrong one loaded a plausible
page rather than erroring ([Verify every curated city slug](../../place-fuzzy-search/issues/02-verify-city-slugs.md)).
Adding a city slug is a verification ritual, documented in the curated overlay file's
header: search Skyscanner by hand, read the slug off the URL, confirm the results span
the city's airports.

## The Skyscanner link

Built by a single function, `buildSkyscannerUrl()`, the only place in the codebase
that knows the URL shape. It takes a Search and returns a string.

Format (the de-facto consumer URL, per ticket 01):

```
https://www.skyscanner.net/transport/flights/{origin}/{destination}/{yymmdd}[/{yymmdd}]/?adults=1&cabinclass=economy&rtn={0|1}&currency={…}&locale={…}&market={…}
```

- `{origin}` / `{destination}` are the Place's IATA code or city slug, lowercased
- dates are `yymmdd` path segments, outbound then inbound; **a one-way link is
  simply the missing second segment**
- `adults=1` and `cabinclass=economy` are constants, matching the fixed
  one-adult-in-economy of the domain language
- `currency`, `locale` and `market` come from app config

The official affiliate referral endpoint is not used in v1 (it requires an
impact.com `mediaPartnerId`). Keeping the URL behind one function is what makes
switching later a one-file change.

## Deleting

A **Candidate** can be deleted, behind a confirmation, and deleting it removes its
PriceObservations with it. This is the one act in the system that destroys price
history, and it exists because a candidate mistyped mid-sweep otherwise sits there
forever.

**Trips and Searches cannot be deleted in v1.** They are created deliberately and
rarely. Archiving is a later question.

No PriceObservation is ever edited or deleted individually. A mistaken amount is
corrected by logging another one.

## Fixed by the language, not configurable

Every price is for **one adult in economy**, so that every Candidate under a Search
is comparable to every other. There are no passenger or cabin controls anywhere in
v1.

## Not in v1

- **Candidate detail page** — full price history and per-observation remarks. The
  first enhancement after v1.
- **Remark entry** — `remark` exists on PriceObservation in the model and schema,
  but nothing in v1 writes it. It arrives with the detail page.
- Editing a Trip name, a Search, or a Candidate label.
- Archiving or deleting Trips and Searches.
- Auth, accounts, multi-user.
- Anything in the map's **Out of scope** section: automated price fetching,
  multi-city, whole-month links, sharing, other providers, notifications,
  import/export.

## Implementation issues

Sliced vertically: each ends with something the User can actually do.

| #                                             | Slice                                      | Triage            |
| --------------------------------------------- | ------------------------------------------ | ----------------- |
| [06](issues/06-places-and-deep-link.md)       | Places generation + `buildSkyscannerUrl()` | `ready-for-agent` |
| [07](issues/07-schema-and-migrations.md)      | Drizzle schema + migrations                | `ready-for-agent` |
| [08](issues/08-trip-list.md)                  | Trip list: see trips, create one           | `ready-for-agent` |
| [09](issues/09-trip-page-searches.md)         | Trip page: Searches and their links        | `ready-for-agent` |
| [10](issues/10-candidate-rows-and-logging.md) | Candidate rows and the logging sweep       | `ready-for-agent` |
| [11](issues/11-latest-price-and-delete.md)    | Latest price + delta, delete Candidate     | `ready-for-agent` |
| [12](issues/12-place-search-input.md)         | Place search input                         | `ready-for-agent` |
