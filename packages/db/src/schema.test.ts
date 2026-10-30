import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { applyMigrations, openDb } from "./client.ts";
import {
  candidates,
  places,
  priceObservations,
  searches,
  trips,
} from "./schema.ts";

function freshDb() {
  const db = openDb(":memory:");
  applyMigrations(db);
  db.insert(places)
    .values([
      {
        id: "LHR",
        kind: "airport",
        name: "Heathrow",
        city: "London",
        country: "UK",
        searchText: "x",
      },
      {
        id: "JFK",
        kind: "airport",
        name: "JFK",
        city: "New York",
        country: "US",
        searchText: "y",
      },
    ])
    .run();
  db.insert(trips).values({ id: "t1", name: "NYC" }).run();
  db.insert(searches)
    .values({
      id: "s1",
      tripId: "t1",
      originId: "LHR",
      destinationId: "JFK",
      departureDate: "2026-10-01",
      currency: "GBP",
    })
    .run();
  db.insert(candidates)
    .values({ id: "c1", searchId: "s1", label: "BA 117", stops: "direct" })
    .run();
  db.insert(priceObservations)
    .values({
      id: "o1",
      candidateId: "c1",
      amount: 420,
      observedAt: "2026-09-23T10:00:00Z",
    })
    .run();
  return db;
}

describe("schema", () => {
  it("cascades a Candidate's deletion to its PriceObservations", () => {
    const db = freshDb();
    db.delete(candidates).where(eq(candidates.id, "c1")).run();
    expect(db.select().from(priceObservations).all()).toEqual([]);
  });

  it("refuses to delete a Search that still has Candidates", () => {
    const db = freshDb();
    expect(() =>
      db.delete(searches).where(eq(searches.id, "s1")).run(),
    ).toThrow(/FOREIGN KEY/);
  });

  it("refuses a Search pointing at an unknown Place", () => {
    const db = freshDb();
    expect(() =>
      db
        .insert(searches)
        .values({
          id: "s2",
          tripId: "t1",
          originId: "XXX",
          destinationId: "JFK",
          departureDate: "2026-10-01",
          currency: "GBP",
        })
        .run(),
    ).toThrow(/FOREIGN KEY/);
  });

  it("refuses a return date before the departure date", () => {
    const db = freshDb();
    expect(() =>
      db
        .insert(searches)
        .values({
          id: "s2",
          tripId: "t1",
          originId: "LHR",
          destinationId: "JFK",
          departureDate: "2026-10-05",
          returnDate: "2026-10-01",
          currency: "GBP",
        })
        .run(),
    ).toThrow(/CHECK/);
  });
});
