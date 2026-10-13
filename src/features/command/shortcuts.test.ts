import { describe, expect, it, vi } from "vitest";
import { runShortcut, type ShortcutHandlers } from "@/features/command/shortcuts";

function handlers(): ShortcutHandlers {
  return {
    palette: vi.fn(),
    addBook: vi.fn(),
    search: vi.fn(),
    escape: vi.fn(),
    exportLibrary: vi.fn(),
    importLibrary: vi.fn(),
    moveSelection: vi.fn(),
    toggleInspector: vi.fn(),
  };
}

function key(target: EventTarget, keyName: string, extras: Partial<KeyboardEvent> = {}) {
  return { key: keyName, target, ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, preventDefault: vi.fn(), ...extras } as KeyboardEvent;
}

describe("runShortcut", () => {
  it("opens the palette with Ctrl+K while typing", () => {
    const fns = handlers();
    runShortcut(key(document.createElement("input"), "k", { ctrlKey: true }), fns);
    expect(fns.palette).toHaveBeenCalledOnce();
  });

  it("does not focus search while typing", () => {
    const fns = handlers();
    runShortcut(key(document.createElement("input"), "/"), fns);
    expect(fns.search).not.toHaveBeenCalled();
  });

  it("focuses search when slash is pressed outside a field", () => {
    const fns = handlers();
    runShortcut(key(document.body, "/"), fns);
    expect(fns.search).toHaveBeenCalledOnce();
  });

  it("moves the rail selection with J and K", () => {
    const fns = handlers();
    runShortcut(key(document.body, "j"), fns);
    runShortcut(key(document.body, "k"), fns);
    expect(fns.moveSelection).toHaveBeenNthCalledWith(1, 1);
    expect(fns.moveSelection).toHaveBeenNthCalledWith(2, -1);
  });

  it("adds a book with Ctrl+N", () => {
    const fns = handlers();
    runShortcut(key(document.body, "n", { ctrlKey: true }), fns);
    expect(fns.addBook).toHaveBeenCalledOnce();
  });
});
