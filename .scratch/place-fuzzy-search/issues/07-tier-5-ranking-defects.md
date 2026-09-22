# 07 — Two ranking defects the real dataset exposed

Parent: ../map.md
Type: grilling
Status: open
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
