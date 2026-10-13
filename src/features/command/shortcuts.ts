const TYPING_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

export interface ShortcutHandlers {
  palette: () => void;
  addBook: () => void;
  search: () => void;
  escape: () => void;
  exportLibrary: () => void;
  importLibrary: () => void;
  moveSelection: (delta: 1 | -1) => void;
  toggleInspector: () => void;
}

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return TYPING_TAGS.has(target.tagName);
}

export function runShortcut(event: KeyboardEvent, handlers: ShortcutHandlers): void {
  const key = event.key;
  const meta = event.ctrlKey || event.metaKey;
  const typing = isTypingTarget(event.target);

  if (meta && key.toLowerCase() === "k") {
    event.preventDefault();
    handlers.palette();
    return;
  }
  if (meta && key.toLowerCase() === "n") {
    event.preventDefault();
    handlers.addBook();
    return;
  }
  if (meta && key.toLowerCase() === "e") {
    event.preventDefault();
    handlers.exportLibrary();
    return;
  }
  if (meta && key.toLowerCase() === "i") {
    event.preventDefault();
    handlers.importLibrary();
    return;
  }
  if (meta && key === "\\") {
    event.preventDefault();
    handlers.toggleInspector();
    return;
  }
  if (key === "Escape") {
    handlers.escape();
    return;
  }
  if (typing || meta || event.altKey) return;
  if (key === "/") {
    event.preventDefault();
    handlers.search();
    return;
  }
  if (key === "j" || key === "J") {
    handlers.moveSelection(1);
    return;
  }
  if (key === "k" || key === "K") {
    handlers.moveSelection(-1);
  }
}
