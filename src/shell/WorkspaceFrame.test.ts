import { beforeEach, describe, expect, it } from "vitest";
import { layoutStorage } from "@/shell/WorkspaceFrame";

describe("layoutStorage", () => {
  beforeEach(() => localStorage.clear());

  it("returns saved layouts", () => {
    layoutStorage.setItem("layout", '{"rail":22}');
    expect(layoutStorage.getItem("layout")).toBe('{"rail":22}');
  });

  it("drops corrupt entries instead of crashing the panels", () => {
    localStorage.setItem("layout", "{oops");
    expect(layoutStorage.getItem("layout")).toBeNull();
    expect(localStorage.getItem("layout")).toBeNull();
    localStorage.setItem("layout", "null");
    expect(layoutStorage.getItem("layout")).toBeNull();
  });
});
