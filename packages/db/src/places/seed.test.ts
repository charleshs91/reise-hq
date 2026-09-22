import { describe, expect, it } from "vitest";
import { foldText } from "./fold.ts";
import type { PlaceRow } from "./row.ts";
import { mergePlaces } from "./seed.ts";

const row = (id: string, overrides: Partial<PlaceRow> = {}): PlaceRow => ({
  id,
  kind: "airport",
  name: `${id} Airport`,
  city: "Somewhere",
  country: "Nowhere",
  type: "large_airport",
  ...overrides,
});

describe("foldText", () => {
  it("strips diacritics and lowercases", () => {
    expect(foldText("Zürich")).toBe("zurich");
    expect(foldText("São Paulo")).toBe("sao paulo");
    expect(foldText("İstanbul")).toBe("istanbul");
  });
});

describe("mergePlaces", () => {
  it("lets the curated overlay win over a generated row", () => {
    const merged = mergePlaces(
      [row("LHR"), row("LGW")],
      [row("LHR", { name: "Heathrow (curated)" })],
    );
    expect(merged.find((p) => p.id === "LHR")?.name).toBe("Heathrow (curated)");
    expect(merged).toHaveLength(2);
  });

  it("builds the folded search text from name, city and id", () => {
    const [zrh] = mergePlaces(
      [row("ZRH", { name: "Zürich Airport", city: "Zürich" })],
      [],
    );
    expect(zrh?.searchText).toBe("zurich airport zurich zrh");
  });

  it("leaves a null city out of the search text", () => {
    const [rur] = mergePlaces(
      [row("RUR", { name: "Rurutu Airport", city: null })],
      [],
    );
    expect(rur?.searchText).toBe("rurutu airport rur");
  });

  it("fails loudly on a duplicate id within the curated overlay", () => {
    expect(() => mergePlaces([], [row("LOND"), row("LOND")])).toThrow(/LOND/);
  });
});
