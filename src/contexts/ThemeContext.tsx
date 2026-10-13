import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { THEMES, getThemeChoice, initTheme, setThemeChoice, type ThemeChoice } from "@/lib/theme";


interface ThemeContextValue {
  choice: ThemeChoice;
  setChoice: (choice: ThemeChoice) => void;
  cycle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [choice, setChoiceState] = useState<ThemeChoice>(getThemeChoice);

  useEffect(() => {
    initTheme();
  }, []);

  const setChoice = useCallback((next: ThemeChoice) => {
    setThemeChoice(next);
    setChoiceState(next);
  }, []);

  const cycle = useCallback(() => {
    const index = THEMES.findIndex((theme) => theme.id === getThemeChoice());
    const next = THEMES[(index + 1) % THEMES.length]?.id ?? "dark";
    setChoice(next);
  }, [setChoice]);

  const value = useMemo(() => ({ choice, setChoice, cycle }), [choice, setChoice, cycle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
