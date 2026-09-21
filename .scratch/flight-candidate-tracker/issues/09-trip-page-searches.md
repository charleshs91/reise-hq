# 09 — Trip page: Searches and their links

Parent: ../map.md
Spec: ../spec.md
Status: ready-for-agent
Depends on: 08

## Goal

The User can add a Search to a Trip and click through to Skyscanner. At this point
the app is already useful without a single Candidate.

## Scope

`/trips/:id`, showing the Trip's name and its Searches. Per Search, a header with
origin → destination, departure date, return date if present, and the generated
Skyscanner link from `buildSkyscannerUrl()` opening in a new tab.

The create-Search form: origin Place, destination Place, departure date, optional
return date. Places come from the curated list as a picker over a closed set — the
User cannot type a free-form code. Currency is taken from app config and is not a
field. There is **no one-way/round-trip toggle**; omitting the return date is what
makes it one-way.

Validation: both Places required, departure required, return not before departure.

## Done when

Add a one-way and a round-trip Search and confirm both links land on the right
Skyscanner results page in a browser.
