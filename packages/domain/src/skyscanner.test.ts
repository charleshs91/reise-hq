import { describe, expect, it } from "vitest";
import { buildSkyscannerUrl, type Place, type Search } from "./index";

const lhr: Place = {
  id: "LHR",
  kind: "airport",
  iata: "LHR",
  name: "London Heathrow",
};
const jfk: Place = {
  id: "JFK",
  kind: "airport",
  iata: "JFK",
  name: "John F Kennedy",
};
const lond: Place = {
  id: "LOND",
  kind: "citySlug",
  slug: "LOND",
  name: "London",
};
const tpet: Place = {
  id: "TPET",
  kind: "citySlug",
  slug: "TPET",
  name: "Taipei",
};

const search = (overrides: Partial<Search> = {}): Search => ({
  origin: lhr,
  destination: jfk,
  departureDate: "2026-03-15",
  returnDate: null,
  currency: "GBP",
  ...overrides,
});

const query = "adults=1&cabinclass=economy";

describe("buildSkyscannerUrl", () => {
  it("builds a one-way link as the missing second date segment", () => {
    expect(buildSkyscannerUrl(search())).toBe(
      `https://www.skyscanner.net/transport/flights/lhr/jfk/260315/?${query}&rtn=0&currency=GBP&locale=en-GB&market=UK`,
    );
  });

  it("builds a round-trip link with both date segments", () => {
    expect(buildSkyscannerUrl(search({ returnDate: "2026-03-22" }))).toBe(
      `https://www.skyscanner.net/transport/flights/lhr/jfk/260315/260322/?${query}&rtn=1&currency=GBP&locale=en-GB&market=UK`,
    );
  });

  it("uses a city slug lowercased as the path segment", () => {
    const url = buildSkyscannerUrl(search({ origin: lond, destination: tpet }));
    expect(url).toContain("/transport/flights/lond/tpet/260315/");
  });

  it("takes the currency from the Search", () => {
    expect(buildSkyscannerUrl(search({ currency: "TWD" }))).toContain(
      "currency=TWD",
    );
  });

  it("rejects an impossible calendar date", () => {
    expect(() =>
      buildSkyscannerUrl(search({ returnDate: "2026-02-30" })),
    ).toThrow(/return date/);
  });

  it("rejects an unparseable date rather than emitting a wrong link", () => {
    expect(() =>
      buildSkyscannerUrl(search({ departureDate: "15/03/2026" })),
    ).toThrow(/departure date/);
  });
});
