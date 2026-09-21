# 02 — Domain model and glossary

Parent: ../map.md
Type: grilling
Status: resolved
Blocked by: 01 (resolved)

## Question

Pin down the domain model and write the first `CONTEXT.md`.

- **Trip**: the travel intent. What fields does it carry beyond a name?
- **Search**: a concrete query within a trip — origin, destination, exact dates, one-way or round-trip, party size, cabin. Which of these are required, and which are fixed by what the deep link can express (see 01)?
- **Candidate**: a loosely identified flight option the user logs by hand. The user's instinct is that it is essentially a free-text identifier plus prices. Is a label enough, or does anything structured earn its place?
- **PriceObservation**: amount, currency, observedAt, remark. Does it belong to a candidate, and can there be more than one per day?
- Where does party size and cabin live, given that comparing a 1-pax price to a 2-pax price is meaningless?

Resolve by writing `CONTEXT.md` at the repo root with the agreed terms.

## Answer

Domain model settled and written to [`CONTEXT.md`](../../../CONTEXT.md) at the repo root.

- **Trip** = name only. No dates, no destination — both are derivable from its Searches, and a second source of truth rots.
- **Search** = origin Place + destination Place + departure date + optional return date, inside a Trip. Round-trip vs one-way is **derived** from the presence of the return date (matches the deep-link behaviour found in 01), never a stored flag. No label of its own — route and dates are its name.
- **Party size and cabin are fixed at one adult, economy, in v1, and are not fields at all.** A field that can only ever hold one value is a lie about the model's flexibility; `buildSkyscannerUrl()` emits `adults=1&cabinclass=economy` as constants. Both go to fog, to be reopened together.
- **Currency lives on the Search**, not on the observation. Together with fixed party/cabin this makes "every price under a Search is comparable" an invariant of the model rather than a discipline the user has to keep.
- **Place** is a first-class term: display name + Skyscanner place identifier, curated, because the identifier is not derivable from IATA (01). Sourcing and storage of the list remains fog.
- **Candidate** = free-text label + required `stops` (`direct` | `one-stop` | `two-plus`). Nothing else structured: every field is friction on an act that must take seconds. `stops` is the one exception because it changes what a price _means_; three buckets rather than a count, since the user doesn't reliably have the count.
- **PriceObservation** = amount + observedAt + optional remark. Append-only, unlimited per day, never edited or overwritten — corrections are new observations. The price history cannot be re-fetched from anywhere, so nothing in the language permits destroying it.
- **User** is named in the glossary as the owner of Trips; v1 has exactly one and never asks who it is. Whether a `userId` column exists in v1 is 03's call.
- **No notion of "booked"** in v1; terminal state stays in fog.

No ADR: each decision above is cheap to reverse and the reasoning fits in the glossary.

**Hint for 04 (prototype):** the user wants `stops` entered as selectable chips, not a drop-down.
