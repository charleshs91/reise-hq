import { describe, expect, it } from "vitest";
import {
  assertPlausible,
  MIN_PLAUSIBLE_AIRPORTS,
  parseCsv,
  selectAirports,
} from "./generate.ts";
import type { PlaceRow } from "./row.ts";

const airportsCsv = [
  `"id","ident","type","name","municipality","iso_country","scheduled_service","iata_code"`,
  `1,"EGLL","large_airport","London Heathrow Airport","London","GB","yes","LHR"`,
  `2,"LSZH","medium_airport","Zürich Airport","Zürich","CH","yes","ZRH"`,
  `3,"XXXX","small_airport","Tiny Strip","Nowhere","GB","yes","TNY"`,
  `4,"LTBA","large_airport","İstanbul Atatürk Airport","İstanbul","TR","no","ISL"`,
  `5,"NOIA","large_airport","No Code Field","Somewhere","GB","yes",""`,
  `6,"NFTE","medium_airport","Rurutu Airport","","PF","yes","RUR"`,
  `7,"KXYZ","medium_airport","Airport, ""Quoted"" Name","Town","US","yes","XYZ"`,
].join("\n");

const countriesCsv = [
  `"id","code","name"`,
  `1,"GB","United Kingdom"`,
  `2,"CH","Switzerland"`,
  `3,"TR","Turkey"`,
  `4,"PF","French Polynesia"`,
  `5,"US","United States"`,
].join("\n");

describe("parseCsv", () => {
  it("handles quoted commas and doubled quotes", () => {
    expect(parseCsv(`a,b\n"x, y","say ""hi"""\n`)).toEqual([
      { a: "x, y", b: 'say "hi"' },
    ]);
  });
});

describe("selectAirports", () => {
  const rows = selectAirports(parseCsv(airportsCsv), parseCsv(countriesCsv));

  it("keeps only IATA-coded, large/medium, scheduled airports", () => {
    expect(rows.map((r) => r.id)).toEqual(["LHR", "ZRH", "RUR", "XYZ"]);
  });

  it("shapes a row keyed by its IATA code with the country's name", () => {
    expect(rows[0]).toEqual({
      id: "LHR",
      kind: "airport",
      name: "London Heathrow Airport",
      city: "London",
      country: "United Kingdom",
      type: "large_airport",
    });
  });

  it("keeps a missing municipality as null rather than inventing one", () => {
    expect(rows.find((r) => r.id === "RUR")?.city).toBeNull();
  });

  it("drops rows whose IATA column is missing entirely", () => {
    expect(
      selectAirports([{ type: "large_airport", scheduled_service: "yes" }], []),
    ).toEqual([]);
  });
});

describe("assertPlausible", () => {
  const airport = (id: string): PlaceRow => ({
    id,
    kind: "airport",
    name: id,
    city: null,
    country: "X",
    type: "large_airport",
  });
  const many = (n: number) =>
    Array.from({ length: n }, (_, i) => airport(`A${String(i)}`));

  it("refuses a truncated download", () => {
    expect(() => {
      assertPlausible(many(MIN_PLAUSIBLE_AIRPORTS - 1));
    }).toThrow(/Implausible/);
  });

  it("accepts the expected size", () => {
    expect(() => {
      assertPlausible(many(3244));
    }).not.toThrow();
  });

  it("refuses duplicate identifiers", () => {
    expect(() => {
      assertPlausible([...many(3000), airport("A0")]);
    }).toThrow(/Duplicate/);
  });
});
