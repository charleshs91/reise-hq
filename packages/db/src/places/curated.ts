import type { PlaceRow } from "./row.ts";

/*
 * Curated Place overlay — merged over the generated airports, and always wins.
 *
 * Every city slug here was read off a live Skyscanner page by a human. A slug is
 * NEVER derived from an IATA metro code: 5 of 11 derived guesses were wrong
 * (TPET not TPEA, CSHA not SHAA, BKKT not BKKA, ROME not ROMA, CGKI not JKTA),
 * and every wrong one loaded a plausible page about somewhere else rather than
 * erroring.
 *
 * To add a city:
 *   1. Search Skyscanner by hand for flights to the city as a whole.
 *   2. Read the slug off the resulting URL (/transport/flights/<from>/<slug>/...).
 *   3. Confirm the results span more than one of the city's airports.
 *   4. Only then add the entry below.
 */
const citySlug = (id: string, city: string, country: string): PlaceRow => ({
  id,
  kind: "citySlug",
  name: `${city} — all airports`,
  city,
  country,
  type: null,
});

export const curatedPlaces: readonly PlaceRow[] = [
  citySlug("TPET", "Taipei", "Taiwan"),
  citySlug("TYOA", "Tokyo", "Japan"),
  citySlug("OSAA", "Osaka", "Japan"),
  citySlug("SELA", "Seoul", "South Korea"),
  citySlug("CSHA", "Shanghai", "China"),
  citySlug("BJSA", "Beijing", "China"),
  citySlug("BKKT", "Bangkok", "Thailand"),
  citySlug("LOND", "London", "United Kingdom"),
  citySlug("NYCA", "New York", "United States"),
  citySlug("PARI", "Paris", "France"),
  citySlug("MILA", "Milan", "Italy"),
  citySlug("ROME", "Rome", "Italy"),
  citySlug("ISTA", "Istanbul", "Turkey"),
  citySlug("CGKI", "Jakarta", "Indonesia"),
];
