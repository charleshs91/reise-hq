# 04 — Core flow prototype

Parent: ../map.md
Type: prototype
Status: resolved
Blocked by: 02 (resolved)

## Question

What does the core flow look and feel like?

Build a cheap, throwaway prototype of: create a trip → add a search → hit the generated Skyscanner link → come back and log a candidate with a price → log another price on that candidate later → see the history.

The question to answer: is logging a price cheap enough that a user will actually do it repeatedly? If it takes more than a few seconds, the price history never gets filled and the product has no point.

Link the prototype from the Answer; do not merge it.

## Answer

**Yes — logging a price is cheap enough, provided it is an inline act on a list, not a destination you navigate to.** Variant B wins, with one structural change.

Three variants were built on a throwaway route (`/prototype/core-flow?variant=A|B|C`, in-memory state, commit `6fedb50`):

- **A — Drill-down**: Trips → Searches → Candidates → candidate detail, logging via a form on the detail page.
- **B — One-screen shelf**: no navigation; every trip, search and candidate on one page, each candidate row carrying a live price box (type, Enter, logged).
- **C — Capture bar**: a sticky capture bar owning the top of the screen, body a reverse-chronological feed of every observation.

### The decision

**B's row-with-a-live-price-box is the core interaction.** Logging a price is a sweep, not a destination: open the Skyscanner link, tab down the rows, type-Enter-type-Enter. A costs four clicks per price and would leave the history unfilled, which is the failure mode the ticket was written to test.

**One change to B: it is scoped to a single Trip, reached from a trip list.** B as prototyped put every trip on one page, which does not survive more than a couple of live trips. So the v1 shape is two screens:

1. **Trip list** — the landing page; names plus enough gist to pick one.
2. **Trip page** — B's shelf for that one Trip: all its Searches, each with its generated Skyscanner link, and all Candidates under them as rows with inline price boxes.

### Consequences carried into the spec

- Two screens is the whole of v1's navigation. There is no Search page and no Candidate page.
- A **candidate detail page** (full price history, per-observation remarks) is explicitly a **follow-up enhancement**, not v1. B shows only a short recent-price strip per row, so v1 accepts that the full history is not readable in place.
- The **remark** field is the casualty of the fast path: in B it is not on the row. v1 keeps remark in the model (it is in `CONTEXT.md`) but the shelf does not surface it; where it gets entered is for the spec to settle.
- Adding a Candidate and logging its first price are one act (B's new-candidate row takes a price).
