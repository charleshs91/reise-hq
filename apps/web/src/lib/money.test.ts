import { describe, expect, it } from "vitest";
import { parseAmount } from "./money";

describe("parseAmount", () => {
  it("reads plain and grouped amounts", () => {
    expect(parseAmount("420")).toBe(420);
    expect(parseAmount(" 1,234.50 ")).toBe(1234.5);
    expect(parseAmount("£99")).toBe(99);
  });

  it("is null for anything that is not a positive amount", () => {
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("abc")).toBeNull();
    expect(parseAmount("0")).toBeNull();
    expect(parseAmount("-5")).toBeNull();
    expect(parseAmount("1.2.3")).toBeNull();
  });
});
