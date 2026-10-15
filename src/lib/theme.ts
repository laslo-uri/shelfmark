export const THEME_KEY = "shelfmark-theme";

export const THEMES = [
  { id: "dark", label: "Dark" },
  { id: "light", label: "Light" },
  { id: "system", label: "System" },
] as const;

export type ThemeChoice = (typeof THEMES)[number]["id"];

export function resolvedTheme(choice: ThemeChoice): "dark" | "light" {
  if (choice === "system" && typeof window !== "undefined") {
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  return choice === "light" ? "light" : "dark";
}

export function getThemeChoice(): ThemeChoice {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return THEMES.some((theme) => theme.id === stored) ? (stored as ThemeChoice) : "dark";
  } catch {
    return "dark";
  }
}

export function applyTheme(choice: ThemeChoice) {
  const resolved = resolvedTheme(choice);
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved === "dark" ? "dark" : "light";
  const themeColor = resolved === "light" ? "#f6f1ea" : "#0e0f11";
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", themeColor);
  document.querySelector('meta[name="color-scheme"]')?.setAttribute("content", resolved);
}

export function setThemeChoice(choice: ThemeChoice) {
  try {
    localStorage.setItem(THEME_KEY, choice);
  } catch {
    /* private mode */
  }
  applyTheme(choice);
}

let systemListenerBound = false;

/** Applies the stored theme. Safe to call repeatedly: the OS listener is bound once. */
export function initTheme() {
  applyTheme(getThemeChoice());
  if (systemListenerBound) return;
  systemListenerBound = true;
  const media = window.matchMedia("(prefers-color-scheme: light)");
  media.addEventListener("change", () => {
    if (getThemeChoice() === "system") applyTheme("system");
  });
}
