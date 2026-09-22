# 09 — Trip page: Searches and their links

Parent: ../map.md
Spec: ../spec.md
Status: resolved
Depends on: 08, 12

## Goal

The User can add a Search to a Trip and click through to Skyscanner. At this point
the app is already useful without a single Candidate.

## Scope

`/trips/:id`, showing the Trip's name and its Searches. Per Search, a header with
origin → destination, departure date, return date if present, and the generated
Skyscanner link from `buildSkyscannerUrl()` opening in a new tab.

The create-Search form: origin Place, destination Place, departure date, optional
return date. Both Places use the Place search input from
[12](12-place-search-input.md). Currency is taken from app config and is not a field.

Dates use a single **two-month date picker** replacing two `<input type="date">`:
it previews the span on hover, counts nights, and cannot express a return before its
departure. **One-way is an explicit `Save as one-way` action** that saves the Search
with no return date — there is **no stored one-way/round-trip flag**; round-trip is
derived from the return date. Visual direction:
[Prototype the Place input](../../place-fuzzy-search/issues/05-place-input-prototype.md)
(selected state by fill, colours as tokens with a dark set).

Validation: both Places required, departure required, return not before departure.

## Done when

Add a one-way and a round-trip Search and confirm both links land on the right
Skyscanner results page in a browser.
