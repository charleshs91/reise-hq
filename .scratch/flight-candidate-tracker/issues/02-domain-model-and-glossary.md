# 02 — Domain model and glossary

Parent: ../map.md
Type: grilling
Status: open
Blocked by: 01 (resolved)

## Question

Pin down the domain model and write the first `CONTEXT.md`.

- **Trip**: the travel intent. What fields does it carry beyond a name?
- **Search**: a concrete query within a trip — origin, destination, exact dates, one-way or round-trip, party size, cabin. Which of these are required, and which are fixed by what the deep link can express (see 01)?
- **Candidate**: a loosely identified flight option the user logs by hand. The user's instinct is that it is essentially a free-text identifier plus prices. Is a label enough, or does anything structured earn its place?
- **PriceObservation**: amount, currency, observedAt, remark. Does it belong to a candidate, and can there be more than one per day?
- Where does party size and cabin live, given that comparing a 1-pax price to a 2-pax price is meaningless?

Resolve by writing `CONTEXT.md` at the repo root with the agreed terms.
