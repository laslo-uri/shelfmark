import { afterEach, describe, expect, it } from "vitest";
import { getPlatform, installHintForPlatform } from "@/lib/platform";

describe("installHintForPlatform", () => {
  afterEach(() => {
    delete (window as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
  });

  it("offers an install hint in a plain browser tab", () => {
    expect(installHintForPlatform(getPlatform())).not.toBeNull();
  });

  it("stays quiet inside the Tauri desktop app", () => {
    (window as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ = {};
    expect(getPlatform().isStandalone).toBe(true);
    expect(installHintForPlatform(getPlatform())).toBeNull();
  });
});
