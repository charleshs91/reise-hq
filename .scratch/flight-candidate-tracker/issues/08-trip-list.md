# 08 — Trip list

Parent: ../map.md
Spec: ../spec.md
Status: resolved
Depends on: 07

## Goal

The User can see their Trips and create one. First slice that runs end to end.

## Scope

The landing page at `/`. Each Trip as a row: its **name** and its **next departure
date** — the earliest departure date across its Searches that is not in the past,
computed on read, never stored on the Trip. A Trip with no Searches, or whose
Searches have all passed, shows no date.

Creating a Trip takes a name and nothing else. Rows link to `/trips/:id`.

Reads go through Server Components, the write through a Server Action. No HTTP API
layer.

## Done when

Create a trip, see it listed, click into it (the trip page may be a stub at this
point).
