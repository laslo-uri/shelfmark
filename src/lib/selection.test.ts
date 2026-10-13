import { describe, expect, it } from "vitest";
import { stepIndex } from "@/lib/selection";

describe("stepIndex", () => {
  it("steps through a list and clamps at the ends", () => {
    expect(stepIndex(3, -1, 1)).toBe(0);
    expect(stepIndex(3, 0, 1)).toBe(1);
    expect(stepIndex(3, 2, 1)).toBe(2);
    expect(stepIndex(3, -1, -1)).toBe(2);
    expect(stepIndex(0, 0, 1)).toBe(-1);
  });
});
