import { describe, expect, it } from "vitest";
import { addMonths, monthGrid, nights, pickDate } from "./calendar";

describe("nights", () => {
  it("counts nights between two ISO dates, across a DST change", () => {
    expect(nights("2026-10-20", "2026-10-27")).toBe(7);
    expect(nights("2026-03-28", "2026-03-30")).toBe(2);
  });
});

describe("monthGrid", () => {
  it("pads a Monday-first month to whole weeks", () => {
    const grid = monthGrid("2026-10");
    expect(grid.length % 7).toBe(0);
    // 1 October 2026 is a Thursday: three blanks, then the 1st.
    expect(grid.slice(0, 4)).toEqual([null, null, null, "2026-10-01"]);
    expect(grid.filter(Boolean)).toHaveLength(31);
  });
});

describe("addMonths", () => {
  it("rolls over the year", () => {
    expect(addMonths("2026-12", 1)).toBe("2027-01");
    expect(addMonths("2026-01", -1)).toBe("2025-12");
  });
});

describe("pickDate", () => {
  it("first pick sets the departure", () => {
    expect(pickDate({ departure: "", return: "" }, "2026-10-01")).toEqual({
      departure: "2026-10-01",
      return: "",
      done: false,
    });
  });

  it("a later pick completes the range", () => {
    expect(
      pickDate({ departure: "2026-10-01", return: "" }, "2026-10-05"),
    ).toEqual({
      departure: "2026-10-01",
      return: "2026-10-05",
      done: true,
    });
  });

  it("a pick before the departure restarts rather than inverting the range", () => {
    expect(
      pickDate({ departure: "2026-10-05", return: "" }, "2026-10-01"),
    ).toEqual({
      departure: "2026-10-01",
      return: "",
      done: false,
    });
  });

  it("a pick on a completed range starts a new one", () => {
    expect(
      pickDate({ departure: "2026-10-01", return: "2026-10-05" }, "2026-11-01"),
    ).toEqual({
      departure: "2026-11-01",
      return: "",
      done: false,
    });
  });
});
