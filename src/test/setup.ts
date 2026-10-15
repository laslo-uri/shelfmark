import "fake-indexeddb/auto";
import "@testing-library/jest-dom/vitest";
import { notifyManager } from "@tanstack/react-query";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Vitest runs without globals, so Testing Library cannot register this itself.
afterEach(() => {
  cleanup();
});

notifyManager.setScheduler((callback) => {
  callback();
});

class TestResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = TestResizeObserver;
Element.prototype.scrollIntoView = () => {};

if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
