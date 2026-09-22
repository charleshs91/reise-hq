# 04 — The match and ranking rule

Parent: ../map.md
Type: grilling
Status: resolved
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

## Answer

### The rule, in one sentence

Fold the query the same way the row was folded, fetch every row whose `search_text`
contains it, then rank by a five-tier table in application code and cut to 10.

### Matching

Matching runs over a new **`search_text`** column on `places`, generated at seed time as
`lower(strip_diacritics(name + ' ' + city + ' ' + id))`. Display always uses the real
columns; only matching sees the folded text.

The column exists because the dataset's English names are spelled with diacritics —
`Zürich Airport`, `São Paulo/Guarulhos`, `İstanbul Airport`, `Malmö Airport` — and
SQLite's `LIKE` folds ASCII case only. Without it, typing `zurich` returns nothing and the
User reads that as "Skyscanner doesn't have it": the same silent failure the whole effort
exists to close, arriving as a missing result instead of a wrong one. Restricting to
"English names" does not avoid this — these _are_ the English names. In code it is
`name.normalize('NFD').replace(/\p{Diacritic}/gu, '')`.

The query is folded identically before it is used. `country` is never part of
`search_text`: it is displayed, never matched.

**IATA codes match by prefix, never infix.** A 3-letter code has no internal structure to
search; `%la%` hits roughly ninety codes and floods the results with rows the User cannot
account for. An exact code wins tier 1 and a prefix rides along in tier 5; an infix hit on
an identifier never scores at all.

### Ranking: five tiers

> **Superseded in part by [Two ranking defects the real dataset exposed](07-tier-5-ranking-defects.md):** tier 5 splits into id prefix (5) and remaining substring (6); city slugs sort first in every tie-break; the `la` row below was wrong about the data and is corrected, and a `tpe` row is added. 07's answer holds the current table.

| Tier | Match                                                              |
| ---- | ------------------------------------------------------------------ |
| 1    | query equals a Place `id` (exact code or slug)                     |
| 2    | `kind = 'citySlug'` and its city name prefix-matches               |
| 3    | `kind = 'airport'` and its `city` prefix-matches                   |
| 4    | `kind = 'airport'` and its `name` prefix-matches                   |
| 5    | any remaining substring hit on name or city, or an `id` prefix hit |

**Ties break by `type` (`large_airport` before `medium_airport`), then alphabetically by
name.** This is the live coupling [03](03-where-places-live.md) flagged: the `type` column
**survives**. Alphabetical alone would put Sarajevo above San Francisco for `sa` on an
accident of spelling.

### City slugs only outrank their own airports when the city was typed

"London" puts **London — all airports** above LHR/LGW/STN/LCY, because tier 2 outranks
tier 3.

**"Heathrow" does not surface London at all.** The slug is matched on its own text like
every other row; `heathrow` is not in London's `search_text`, so it does not match, so it
does not appear. The slug wins only inside tier 2 — the case where the User actually typed
the city. Promoting it any other time is us guessing at intent, in a domain where a
plausible wrong answer is the expensive failure.

### Query and results

- **Minimum 2 characters** before a search fires. Two is a wide net over ~3,244 rows, but
  the cap plus an explicit tier order makes the net harmless, and it keeps "LA…" responsive.
- **Cap 10.** When the cap truncates, say so: _showing 10 of 240 — keep typing_. A silently
  truncated list reads as "my airport isn't here".

### Where it runs, and what does the matching

A **Server Action per keystroke against SQLite**, debounced. ~3,244 rows is nothing for
SQLite, and holding the set in server memory buys nothing while adding a lifecycle
question (warm-up, invalidation after re-seed). The client never receives the dataset.
[05](05-place-input-prototype.md) measures whether the latency actually feels right.

**One `LIKE '%q%'` query fetches candidates; the ranking runs in TypeScript.** FTS5 is a
token-prefix engine and fights a substring rule, and the tier order written as a SQL `CASE`
ladder is unreadable and effectively untestable.

**What the spec says is the rule, not the SQL**: candidates are fetched from `places`, the
ranking function is pure, and it is unit-tested against the table below. That `LIKE` does
the fetching today is an implementation note.

### The testable table

Ranking is a pure function over candidate rows, tested as query → expected top results.

| Query      | Expected top results, in order                         | Why                                               |
| ---------- | ------------------------------------------------------ | ------------------------------------------------- |
| `lhr`      | London Heathrow                                        | tier 1, exact id                                  |
| `london`   | London — all airports, then LHR, LGW, STN, LCY         | tier 2 above tier 3; LHR first on `large_airport` |
| `heathrow` | London Heathrow — **no London — all airports**         | tier 4 only; the slug does not match the word     |
| `zurich`   | Zürich Airport                                         | folded `search_text`; display keeps `Zürich`      |
| `sao p`    | São Paulo/Guarulhos                                    | folded; space-bearing prefix                      |
| `sa`       | large airports before medium, alphabetical within each | tie-break is `type` first, not spelling           |
| `la`       | LAX, La Paz… — **never GLA**                           | id prefix scores, id infix does not               |
| `gla`      | Glasgow                                                | tier 1                                            |
| `xqz`      | empty state                                            | nothing matches                                   |
| `l`        | nothing searched                                       | below the 2-character minimum                     |

### Nothing matches

The empty state reads **"No matching airport or city — try the airport code."** There is no
submit path out of it.

Enforcement is structural rather than a validation message:

- the form field holds **a selected Place or nothing**; the typed string lives only in the
  search box and is never a form value;
- submit is disabled until both Places are selected;
- server-side, Search creation **rejects any `placeId` absent from `places`**.

Free text is never a Place at any layer. This is the invariant the effort is built on, so
it is enforced three times rather than trusted once.

**A code we filtered out** — `ISL` (İstanbul Atatürk) and the other 1,324 rows dropped by
`scheduled_service = 'yes'` — gets the same plain empty state as a typo. Distinguishing it
would mean seeding the excluded rows purely to apologise for them. Noted in the fog, not
built.

### Edit this lands on 03

`places` gains **`search_text`** (text, not null, generated at seed time). `type` stays —
ranking uses it. [Amend the v1 spec](06-amend-the-v1-spec.md) carries both into issue 07.
