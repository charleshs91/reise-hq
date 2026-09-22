import { describe, expect, it } from "vitest";
import { latestPrice } from "./index";

const obs = (amount: number, observedAt: string) => ({ amount, observedAt });

describe("latestPrice", () => {
  it("is null with no observations", () => {
    expect(latestPrice([])).toBeNull();
  });

  it("shows no delta with only one observation", () => {
    expect(latestPrice([obs(420, "2026-09-01T10:00:00Z")])).toEqual({
      amount: 420,
      delta: null,
    });
  });

  it("compares the latest against the immediately previous one, not the first", () => {
    expect(
      latestPrice([
        obs(500, "2026-09-01T10:00:00Z"),
        obs(380, "2026-09-03T10:00:00Z"),
        obs(400, "2026-09-02T10:00:00Z"),
      ]),
    ).toEqual({ amount: 380, delta: { direction: "down", magnitude: 20 } });
  });

  it("reports a rise and an unchanged price", () => {
    const up = latestPrice([
      obs(400, "2026-09-01T10:00:00Z"),
      obs(450, "2026-09-02T10:00:00Z"),
    ]);
    expect(up?.delta).toEqual({ direction: "up", magnitude: 50 });
    const flat = latestPrice([
      obs(400, "2026-09-01T10:00:00Z"),
      obs(400, "2026-09-02T10:00:00Z"),
    ]);
    expect(flat?.delta).toEqual({ direction: "flat", magnitude: 0 });
  });
});
