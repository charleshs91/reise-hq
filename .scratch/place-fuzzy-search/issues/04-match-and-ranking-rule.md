# 04 — The match and ranking rule

Parent: ../map.md
Type: grilling
Status: open
Blocked by: none <!-- 01 resolved -->

## Question

Matching is substring, case-insensitive, over display name + city + IATA code; country is
shown but never matched; there is no typo tolerance. Ranking is therefore the whole of the
quality of this feature, and it is specified explicitly rather than left to a library
score.

- **The order.** Proposed: exact IATA match first, then curated city-slug entries whose
  city name prefix-matches, then airports whose city prefix-matches, then name
  substring. Confirm or reshape it, and settle ties (alphabetical? by airport type, so
  `large_airport` outranks `medium_airport`?). **[03](03-where-places-live.md) carried a
  `type` column on the bet that you want this — if the ranking ignores airport size, say
  so and the column gets dropped.** Note the seeded set is now ~3,244 rows
  (`scheduled_service = 'yes'` required), not 4,568.
- **City slugs above their own airports.** Typing "London" should put "London — all
  airports" above LHR/LGW/STN/LCY. Does that hold when the query matches an airport name
  better than the city name ("Heathrow")?
- **The query.** Minimum characters before searching, and result cap. Starting point: 2
  and 10.
- **Where it runs.** A Server Action per keystroke against SQLite, or the filtered set
  held in server memory? Note that the client must never receive the whole dataset.
- **Whether SQLite does the matching** (`LIKE`, or FTS5) or the seeded rows are matched
  in application code — and whether that choice is visible in the spec at all.
- **Nothing matches.** What the User sees, and — the important half — that free text is
  never submittable as a Place under any circumstance.

Write the rule down as something testable: a table of query → expected top results.
