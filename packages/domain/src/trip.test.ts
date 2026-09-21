import { describe, expect, it } from "vitest";
import { tripDurationInDays, type Trip } from "./index";

const trip = (overrides: Partial<Trip> = {}): Trip => ({
  id: "t1",
  destination: "Lisbon",
  startDate: "2026-04-01",
  endDate: "2026-04-05",
  ...overrides,
});

describe("tripDurationInDays", () => {
  it("counts both the first and last day", () => {
    expect(tripDurationInDays(trip())).toBe(5);
  });

  it("returns 1 for a same-day trip", () => {
    expect(tripDurationInDays(trip({ endDate: "2026-04-01" }))).toBe(1);
  });

  it("throws on an unparseable date", () => {
    expect(() => tripDurationInDays(trip({ endDate: "not-a-date" }))).toThrow(
      /unparseable date range/,
    );
  });
});
