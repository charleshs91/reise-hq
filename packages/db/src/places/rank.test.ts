import { describe, expect, it } from "vitest";
import { mergePlaces } from "./seed.ts";
import { rankPlaces } from "./rank.ts";
import type { PlaceRow } from "./row.ts";

const airport = (
  id: string,
  name: string,
  city: string | null,
  type: PlaceRow["type"] = "large_airport",
): PlaceRow => ({ id, kind: "airport", name, city, country: "X", type });
const slug = (id: string, city: string): PlaceRow => ({
  id,
  kind: "citySlug",
  name: `${city} — all airports`,
  city,
  country: "X",
  type: null,
});

// A small hand-built fixture shaped like the real rows, so re-seeding cannot break these.
const fixture = mergePlaces(
  [
    airport("LHR", "London Heathrow Airport", "London"),
    airport("LGW", "London Gatwick Airport", "London"),
    airport("STN", "London Stansted Airport", "London, Essex"),
    airport("LCY", "London City Airport", "London", "medium_airport"),
    airport("LTN", "London Luton Airport", "Luton, Luton"),
    airport("ZRH", "Zürich Airport", "Zurich"),
    airport("GRU", "São Paulo/Guarulhos International Airport", "São Paulo"),
    airport("VXE", "Cesaria Evora International Airport", "São Pedro"),
    airport("LAX", "Los Angeles International Airport", "Los Angeles"),
    airport("LHE", "Allama Iqbal International Airport", "Lahore"),
    airport("LPB", "El Alto International Airport", "La Paz"),
    airport(
      "LRM",
      "La Romana International Airport",
      "La Romana",
      "medium_airport",
    ),
    airport("LAS", "Harry Reid International Airport", "Las Vegas"),
    airport("GLA", "Glasgow International Airport", "Glasgow"),
    airport(
      "ULA",
      "Capitán José Daniel Vazquez Airport",
      "Puerto San Julián",
      "medium_airport",
    ),
    airport("TPE", "Taiwan Taoyuan International Airport", "Taoyuan"),
    airport(
      "MPL",
      "Montpellier-Méditerranée Airport",
      "Montpellier/Méditerranée",
    ),
    airport("SCL", "Arturo Merino Benítez International Airport", "Santiago"),
    airport("SAW", "Istanbul Sabiha Gökçen International Airport", "Istanbul"),
    airport(
      "SAV",
      "Savannah Hilton Head International Airport",
      "Savannah",
      "medium_airport",
    ),
  ],
  [slug("LOND", "London"), slug("TPET", "Taipei")],
);

const ids = (query: string) => rankPlaces(query, fixture).map((p) => p.id);
const before = (list: string[], a: string, b: string) =>
  list.indexOf(a) < list.indexOf(b);

describe("rankPlaces", () => {
  it("lhr: the exact id", () => {
    expect(ids("lhr")[0]).toBe("LHR");
  });

  it("london: the city slug, then London airports large before medium, alphabetically", () => {
    expect(ids("london").slice(0, 5)).toEqual([
      "LOND",
      "LGW",
      "LHR",
      "STN",
      "LCY",
    ]);
  });

  it("heathrow: the airport, and no city slug", () => {
    expect(ids("heathrow")).toEqual(["LHR"]);
  });

  it("zurich: finds Zürich through the folded text", () => {
    expect(ids("zurich")).toEqual(["ZRH"]);
  });

  it("sao p: a space-bearing prefix over folded text", () => {
    // São Pedro (VXE) ties with São Paulo as a city prefix and wins on name.
    expect(ids("sao p")).toEqual(["VXE", "GRU"]);
  });

  it("sa: large before medium within a tier, alphabetical within each", () => {
    const list = ids("sa");
    expect(list.slice(0, 4)).toEqual(["SCL", "VXE", "GRU", "SAV"]);
    expect(before(list, "SAV", "SAW")).toBe(true); // SAW scores only on its id prefix
  });

  it("la: city-prefix airports before LAX, and an id infix never scores", () => {
    const list = ids("la");
    for (const cityPrefixed of ["LHE", "LPB", "LRM", "LAS"]) {
      expect(before(list, cityPrefixed, "LAX")).toBe(true);
    }
    expect(list).not.toContain("ULA");
    expect(before(list, "LAX", "GLA")).toBe(true);
  });

  it("tpe: exact id, then the TPET id prefix, then the Montpellier infix", () => {
    expect(ids("tpe")).toEqual(["TPE", "TPET", "MPL"]);
  });

  it("gla: the exact id", () => {
    expect(ids("gla")[0]).toBe("GLA");
  });

  it("xqz: nothing", () => {
    expect(ids("xqz")).toEqual([]);
  });

  it("l: below the two-character minimum, nothing searched", () => {
    expect(ids("l")).toEqual([]);
  });

  it("folds the query too", () => {
    expect(ids("ZÜRICH")).toEqual(["ZRH"]);
  });
});
