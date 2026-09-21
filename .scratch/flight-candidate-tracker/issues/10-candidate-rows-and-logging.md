# 10 — Candidate rows and the logging sweep

Parent: ../map.md
Spec: ../spec.md
Status: ready-for-agent
Depends on: 09

## Goal

The core interaction the whole product exists for: logging a price in a few seconds.

## Scope

Under each Search on the trip page, its Candidates as rows. Per row: the label, the
**stops** value as three single-selection chips (all three visible, one tap to
select, no dropdown), and an always-live **price box**.

Typing an amount in the price box and pressing **Enter** records a PriceObservation
at the current time and clears the box. No save button, no dialog, no navigation,
no confirmation.

At the end of each Search's rows, a **new-candidate row** — label, stops chips,
price box — that creates the Candidate and its first PriceObservation as one act. A
Candidate cannot exist without a first price.

Tab order must run down the rows so the sweep is
price-Enter-Tab-price-Enter without touching the mouse.

## Done when

Logging ten prices across several candidates is a keyboard-only sweep. If it isn't,
this issue is not done — see the spec's "one thing that must be true".
