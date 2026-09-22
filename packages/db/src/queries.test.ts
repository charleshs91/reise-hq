import { beforeEach, describe, expect, it } from "vitest";
import { applyMigrations, openDb, type Db } from "./client.ts";
import { mergePlaces, seedPlaces } from "./places/seed.ts";
import {
  createCandidate,
  createSearch,
  createTrip,
  deleteCandidate,
  getTripPage,
  listTrips,
  logPrice,
  searchPlaces,
  UnknownPlaceError,
} from "./queries.ts";

let db: Db;

beforeEach(() => {
  db = openDb(":memory:");
  applyMigrations(db);
  seedPlaces(
    db,
    mergePlaces(
      [
        {
          id: "LHR",
          kind: "airport",
          name: "London Heathrow Airport",
          city: "London",
          country: "United Kingdom",
          type: "large_airport",
        },
        {
          id: "LGW",
          kind: "airport",
          name: "London Gatwick Airport",
          city: "London",
          country: "United Kingdom",
          type: "large_airport",
        },
        {
          id: "ZRH",
          kind: "airport",
          name: "Zürich Airport",
          city: "Zurich",
          country: "Switzerland",
          type: "large_airport",
        },
      ],
      [
        {
          id: "LOND",
          kind: "citySlug",
          name: "London — all airports",
          city: "London",
          country: "United Kingdom",
          type: null,
        },
      ],
    ),
    { source: "test", fetchedOn: "2026-09-23", rowCount: 3 },
  );
});

const newSearch = (
  tripId: string,
  overrides: Partial<Parameters<typeof createSearch>[1]> = {},
) =>
  createSearch(db, {
    tripId,
    originId: "LHR",
    destinationId: "ZRH",
    departureDate: "2026-10-01",
    returnDate: null,
    ...overrides,
  });

describe("trips", () => {
  it("lists a new Trip with no next departure", () => {
    const id = createTrip(db, "  Zürich weekend ");
    expect(listTrips(db, "2026-09-23")).toEqual([
      { id, name: "Zürich weekend", nextDepartureDate: null },
    ]);
  });

  it("rejects a blank name", () => {
    expect(() => createTrip(db, "   ")).toThrow(/name/);
  });

  it("reads the next departure off the Trip's Searches", () => {
    const id = createTrip(db, "Zürich");
    newSearch(id, { departureDate: "2026-09-01" });
    newSearch(id, { departureDate: "2026-11-01" });
    newSearch(id, { departureDate: "2026-10-01" });
    expect(listTrips(db, "2026-09-23")[0]?.nextDepartureDate).toBe(
      "2026-10-01",
    );
  });
});

describe("searches", () => {
  it("stamps the currency from app config and resolves both Places", () => {
    const tripId = createTrip(db, "Zürich");
    newSearch(tripId, { returnDate: "2026-10-05" });
    const [search] = getTripPage(db, tripId)?.searches ?? [];
    expect(search?.currency).toBe("GBP");
    expect(search?.origin).toEqual({
      id: "LHR",
      kind: "airport",
      iata: "LHR",
      name: "London Heathrow Airport",
    });
    expect(search?.returnDate).toBe("2026-10-05");
  });

  it("rejects a Place id that is not a known Place", () => {
    const tripId = createTrip(db, "Zürich");
    expect(() => newSearch(tripId, { originId: "lhr" })).toThrow(
      UnknownPlaceError,
    );
  });

  it("rejects a return before the departure", () => {
    const tripId = createTrip(db, "Zürich");
    expect(() => newSearch(tripId, { returnDate: "2026-09-30" })).toThrow(
      /return/i,
    );
  });
});

describe("candidates and prices", () => {
  function setup() {
    const tripId = createTrip(db, "Zürich");
    const searchId = newSearch(tripId);
    return { tripId, searchId };
  }

  it("creates a Candidate together with its first price", () => {
    const { tripId, searchId } = setup();
    createCandidate(db, {
      searchId,
      label: "LX 317",
      stops: "direct",
      amount: 180,
      observedAt: "2026-09-23T09:00:00Z",
    });
    const candidate = getTripPage(db, tripId)?.searches[0]?.candidates[0];
    expect(candidate).toMatchObject({ label: "LX 317", stops: "direct" });
    expect(candidate?.observations).toEqual([
      { amount: 180, observedAt: "2026-09-23T09:00:00Z" },
    ]);
  });

  it("appends observations without overwriting", () => {
    const { tripId, searchId } = setup();
    const id = createCandidate(db, {
      searchId,
      label: "LX 317",
      stops: "direct",
      amount: 180,
      observedAt: "2026-09-23T09:00:00Z",
    });
    logPrice(db, {
      candidateId: id,
      amount: 165,
      observedAt: "2026-09-24T09:00:00Z",
    });
    const candidate = getTripPage(db, tripId)?.searches[0]?.candidates[0];
    expect(candidate?.observations.map((o) => o.amount)).toEqual([180, 165]);
  });

  it("rejects a non-positive or non-numeric price", () => {
    const { searchId } = setup();
    expect(() =>
      createCandidate(db, {
        searchId,
        label: "x",
        stops: "direct",
        amount: 0,
        observedAt: "2026-09-23T09:00:00Z",
      }),
    ).toThrow(/amount/);
    expect(() =>
      createCandidate(db, {
        searchId,
        label: "x",
        stops: "direct",
        amount: Number.NaN,
        observedAt: "2026-09-23T09:00:00Z",
      }),
    ).toThrow(/amount/);
  });

  it("deletes a Candidate and its history", () => {
    const { tripId, searchId } = setup();
    const id = createCandidate(db, {
      searchId,
      label: "LX 317",
      stops: "direct",
      amount: 180,
      observedAt: "2026-09-23T09:00:00Z",
    });
    deleteCandidate(db, id);
    expect(getTripPage(db, tripId)?.searches[0]?.candidates).toEqual([]);
  });

  it("is null for an unknown Trip", () => {
    expect(getTripPage(db, "nope")).toBeNull();
  });
});

describe("searchPlaces", () => {
  it("ranks, caps and counts", () => {
    const result = searchPlaces(db, "london", 2);
    expect(result.places.map((p) => p.id)).toEqual(["LOND", "LGW"]);
    expect(result.total).toBe(3);
  });

  it("folds the query before matching", () => {
    expect(searchPlaces(db, "ZÜRICH").places.map((p) => p.id)).toEqual(["ZRH"]);
  });

  it("treats LIKE wildcards in the query literally", () => {
    expect(searchPlaces(db, "%%").total).toBe(0);
    expect(searchPlaces(db, "l_").total).toBe(0);
  });

  it("returns plain objects that React can serialise", () => {
    const [place] = searchPlaces(db, "zrh").places;
    expect(Object.getPrototypeOf(place)).toBe(Object.prototype);
  });
});
