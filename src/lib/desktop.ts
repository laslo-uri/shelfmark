export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function bindWindowControls(): Promise<void> {
  if (!isTauri()) return;
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  const win = getCurrentWindow();
  bind("titlebar-minimize", () => void win.minimize());
  bind("titlebar-maximize", () => void win.toggleMaximize());
  bind("titlebar-close", () => void win.close());
}

function bind(id: string, action: () => void): void {
  const button = document.getElementById(id);
  if (!button || button.dataset.bound === "1") return;
  button.dataset.bound = "1";
  button.addEventListener("click", action);
}
