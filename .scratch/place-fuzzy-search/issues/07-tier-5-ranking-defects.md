# 07 — Two ranking defects the real dataset exposed

Parent: ../map.md
Type: grilling
Status: resolved
Blocked by: none

## Question

[The match and ranking rule](04-match-and-ranking-rule.md) was settled against a worked
table of ten queries. [Prototyping the Place input](05-place-input-prototype.md) ran it
against all 3,258 real rows and found two cases the table does not cover. Both are the
same shape: **tier 5 is a single bucket holding two very different kinds of match**, and
its tie-break cannot tell them apart.

1. **An id prefix loses to an accidental infix.** Typing `TPE` puts **MPL Montpellier**
   above **TPET Taipei — every airport**: "Mon`tpe`llier" contains the query, and both
   land in tier 5. The User typed three letters of an identifier and the top city-level
   answer is in France.

2. **City slugs lose every tie-break.** The tie-break is `type` (`large_airport` before
   `medium_airport`), and slugs carry `type = null` by [03](03-where-places-live.md)'s
   schema, so a slug sorts behind _every_ large airport it ties with. The `TPE` case
   above is this defect compounding the first one.

A related case sits in the same area: [04](04-match-and-ranking-rule.md)'s table predicts
`la` → "LAX, La Paz…", but LAX is really outranked by Lahore, La Romana, La Paz and Las
Vegas — its city is "Los Angeles", so it only scores tier 5 on the id prefix while they
take tier 3 on a city prefix. Whether that is a defect or the rule working as intended is
part of this question: an id prefix is a weaker signal than a city prefix, but the
prototype suggests the User who types `la` may not agree.

Decide whether tier 5 splits (id prefix above name/city infix), whether slugs get a
tie-break value of their own rather than inheriting `null`, and update
[04](04-match-and-ranking-rule.md)'s worked table with whatever the answer is — the table
is what gets unit-tested, so a wrong row there becomes a wrong test.

## Answer

### Tier 5 splits: six tiers

| Tier | Match                                                |
| ---- | ---------------------------------------------------- |
| 1    | query equals a Place `id` (exact code or slug)       |
| 2    | `kind = 'citySlug'` and its city name prefix-matches |
| 3    | `kind = 'airport'` and its `city` prefix-matches     |
| 4    | `kind = 'airport'` and its `name` prefix-matches     |
| 5    | `id` prefix-matches                                  |
| 6    | any remaining substring hit on name or city          |

An id prefix is a deliberate signal; an infix inside a name is an accident of spelling. They
no longer share a bucket. Id prefix stays **below** city and name prefixes, not above them:
at two letters the start of a city name is the stronger signal (promoting codes would put
SAN, SAT, SAV above Santiago for `sa`), and at three letters anyone typing a code already
hits tier 1.

### `la` was a table error, not a rule defect

LAX's city is "Los Angeles", so for `la` it scores only on its id prefix, below every
airport whose city starts with "La" (Lahore, La Paz, La Romana, Las Vegas…). That is the
rule working as intended. 04's table row predicting "LAX, La Paz…" was wrong about the
data and is corrected below; the rule is not bent to fit it.

### City slugs sort first in every tie

The tie-break becomes **`kind = 'citySlug'` first, then `type` (`large_airport` before
`medium_airport`), then alphabetically by name.** It keys on `kind`, so slugs carry no
synthetic `type`: `type` keeps meaning only what the dataset says, and 03's schema is
unchanged. There are 14 slugs, each standing for a whole city — the broadest correct
answer in any tier it ties in.

### The testable table (supersedes 04's)

| Query      | Expected top results, in order                                                          | Why                                               |
| ---------- | --------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `lhr`      | London Heathrow                                                                         | tier 1, exact id                                  |
| `london`   | London — all airports, then LHR, LGW, STN, LCY                                          | tier 2 above tier 3; LHR first on `large_airport` |
| `heathrow` | London Heathrow — **no London — all airports**                                          | tier 4 only; the slug does not match the word     |
| `zurich`   | Zürich Airport                                                                          | folded `search_text`; display keeps `Zürich`      |
| `sao p`    | São Paulo/Guarulhos                                                                     | folded; space-bearing prefix                      |
| `sa`       | large airports before medium, alphabetical within each                                  | tie-break is `type` first, not spelling           |
| `la`       | city-prefix airports (Lahore, La Paz, La Romana, Las Vegas…) before LAX — **never GLA** | tier 3 above tier 5; id infix never scores        |
| `tpe`      | Taiwan Taoyuan (TPE), then Taipei — every airport (TPET), **then** Montpellier          | tier 1, tier 5 id prefix, tier 6 infix            |
| `gla`      | Glasgow                                                                                 | tier 1                                            |
| `xqz`      | empty state                                                                             | nothing matches                                   |
| `l`        | nothing searched                                                                        | below the 2-character minimum                     |

The `la` and `tpe` rows are asserted on relative order, not on an exact top ten — the
fixture should be a small hand-built row set, not the live dataset, so re-seeding cannot
break the test.

### Lands on

[Amend the v1 spec](06-amend-the-v1-spec.md) carries the six-tier table, the tie-break, and
this test table into implementation issue 07. No `CONTEXT.md` or ADR change: ranking is an
implementation rule, not a domain term, and it is cheap to reverse.
