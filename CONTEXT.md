# Context: reise-hq

The domain language of the flight-candidate tracker. This file is a glossary and
nothing else — no schemas, no screens, no implementation decisions.

## User

The person the data belongs to. A **Trip** belongs to a User.

v1 is single-user and self-hosted: there is exactly one User and the system never
asks who it is. The term exists so that ownership is already part of the language
when accounts arrive, rather than being retrofitted onto it.

## Trip

A named travel intent — "Japan in March" — and nothing more. A Trip is a folder
that holds **Search**es.

A Trip carries no dates and no destination of its own. Both would duplicate what
its Searches already state, and a second source of truth for the same fact is the
thing that goes stale. Any window or destination a reader wants is read off the
Searches.

A Trip has no terminal state: the system has no notion of a flight having been
bought. The User simply stops opening it.

## Search

A concrete query within a Trip: an origin **Place**, a destination Place, a
departure date, and optionally a return date. Exact dates only — never a month or
a range.

A Search is **round-trip** when it has a return date and **one-way** when it does
not. This is derived, never stored as a flag, so the two can never disagree.

A Search has no label. Its route and dates are its name.

Every price under a Search is for **one adult in economy**. This is not a field:
it is a property of the language in v1. It exists so that every **Candidate**
under a Search is comparable to every other one — comparing a one-passenger price
to a two-passenger price is meaningless, so the model makes comparability an
invariant rather than a discipline the User has to keep.

A Search also fixes the **currency** all its prices are quoted in, for the same
reason.

A Search is what a Skyscanner deep link is generated from. The link is always
generated, never fetched.

## Place

An airport or city the User can search from or to, as a named thing rather than a
raw string: a display name the human reads, and the identifier Skyscanner's URLs
use for it.

That identifier is of one of two kinds, and they are different systems: the
**IATA code** of a single airport, or a **Skyscanner city slug** standing for all
the airports of a multi-airport city. A city slug is never derivable from an IATA
code. The known Places are an open airport dataset plus a small set of city slugs:
the dataset supplies the IATA codes, and every city slug was read off a real
Skyscanner URL by a human, never computed. A Place the User cannot name is a Place they
cannot search, and that is the intended trade: a wrong identifier does not fail
loudly, it quietly returns a plausible page about somewhere else.

## Candidate

A specific flight option the User has seen on Skyscanner and logged by hand,
within one Search.

A Candidate is a free-text **label** — "BA direct 07:55", "ANA via HND" — plus how
many **stops** it has: `direct`, `one-stop`, or `two-plus`. Stops is required.

Nothing else about the flight is structured. Carrier, times and aircraft live in
the label, because every structured field is one more thing to fill in each time,
and the tracker is worthless if logging a price is not a few-seconds act.

Stops earns its place as the exception: whether a flight is direct changes what
its price _means_, and three buckets is what a human reads off a results page
without squinting. It is three values rather than a count because a count invites
a precision the User does not reliably have.

## PriceObservation

What a Candidate cost at the moment the User looked: an **amount**, the time it
was **observed at**, and an optional free-text **remark** ("basic economy, no
bag", "went up when I refreshed").

The amount carries no currency of its own; it is in the currency of its Search.

Observations are **append-only**. A Candidate may have any number of them, several
on the same day, and none is ever edited or overwritten — a mistaken entry is
corrected by adding another observation, not by changing the old one. The price
history is the only irreplaceable data in the system: it cannot be re-fetched from
anywhere.

There is exactly one way it is ever destroyed: **deleting the Candidate that holds
it**, a deliberate act on a whole row. No observation is ever removed on its own.
The exception exists because a Candidate mistyped mid-sweep would otherwise be
permanent, and it is the only one.

The remark is the escape hatch that lets the rest of the model stay this small:
whatever the terms above do not capture goes there in a few words.
