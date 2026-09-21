# 11 — Latest price, delta, and deleting a Candidate

Parent: ../map.md
Spec: ../spec.md
Status: ready-for-agent
Depends on: 10

## Goal

A row shows whether its price is moving, and a mistyped Candidate can be removed.

## Scope

Per Candidate row, the **latest price** and its **delta against the immediately
previous observation** — direction and magnitude. With only one observation, no
delta is shown. This is the entire price history surfaced in v1; the full history is
the follow-up candidate detail page.

A **delete** control on the row, behind a confirmation that says plainly that the
price history goes with it. Deleting a Candidate removes its PriceObservations.

No other deletion exists: Trips and Searches are not deletable in v1, and an
individual PriceObservation is never edited or deleted — a mistake is corrected by
logging another.

## Done when

A row with two observations shows the direction of travel, and deleting a Candidate
asks first.
