import { describe, expect, it } from "vitest";
import { nextDepartureDate } from "./index";

const today = "2026-09-23";

describe("nextDepartureDate", () => {
  it("is null for a Trip with no Searches", () => {
    expect(nextDepartureDate([], today)).toBeNull();
  });

  it("is the earliest departure not in the past", () => {
    expect(
      nextDepartureDate(
        [
          { departureDate: "2026-12-01" },
          { departureDate: "2026-10-05" },
          { departureDate: "2026-09-01" },
        ],
        today,
      ),
    ).toBe("2026-10-05");
  });

  it("counts a departure today as not in the past", () => {
    expect(nextDepartureDate([{ departureDate: today }], today)).toBe(today);
  });

  it("is null when every Search has departed", () => {
    expect(
      nextDepartureDate([{ departureDate: "2026-01-01" }], today),
    ).toBeNull();
  });
});
