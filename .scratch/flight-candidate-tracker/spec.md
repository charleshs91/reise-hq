# Spec: Flight Candidate Tracker v1

Status: ready for implementation
Map: [map.md](map.md) · Glossary: [`CONTEXT.md`](../../CONTEXT.md) · [ADR 0001](../../docs/adr/0001-sqlite-for-single-user-storage.md)

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

Both Places are picked from the curated list (see Places). Dates are exact — no
month, no range, no flexibility. Omitting the return date makes it a one-way
Search; there is no one-way/round-trip toggle, because round-trip is derived from
the return date's presence.

The Search's **currency** is populated from app config at creation and is not
asked for.

Validation: both Places required, departure date required, return date (if given)
not before the departure date.

## Places

One curated, closed list, checked into the repo and loaded by a seed script.
Adding a Place is a code edit; there is no admin screen, and the User cannot type
a free-form code. This is deliberate: the failure mode of a wrong Skyscanner
identifier is a plausible-looking wrong results page, not an error, so the set of
identifiers is one a human has verified.

Each Place has a display name and one of two kinds of identifier:

- `{ kind: "airport", iata }` — a 3-letter IATA airport code, for single-airport
  places (`LHR`, `JFK`)
- `{ kind: "citySlug", slug }` — a Skyscanner city slug, for multi-airport cities
  (`LOND`, `NYCA`)

**A city slug is never derived from an IATA code.** The two are different systems
and the "metro code + A" pattern does not hold generally. Each slug in the list was
observed in a real Skyscanner URL.

Seed the list with whatever the User actually searches; a few dozen entries is the
expected size.

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

| #                                             | Slice                                  | Triage            |
| --------------------------------------------- | -------------------------------------- | ----------------- |
| [06](issues/06-places-and-deep-link.md)       | Places seed + `buildSkyscannerUrl()`   | `ready-for-agent` |
| [07](issues/07-schema-and-migrations.md)      | Drizzle schema + migrations            | `ready-for-agent` |
| [08](issues/08-trip-list.md)                  | Trip list: see trips, create one       | `ready-for-agent` |
| [09](issues/09-trip-page-searches.md)         | Trip page: Searches and their links    | `ready-for-agent` |
| [10](issues/10-candidate-rows-and-logging.md) | Candidate rows and the logging sweep   | `ready-for-agent` |
| [11](issues/11-latest-price-and-delete.md)    | Latest price + delta, delete Candidate | `ready-for-agent` |
