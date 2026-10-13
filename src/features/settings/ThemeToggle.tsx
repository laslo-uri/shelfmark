import { Monitor, Moon, Sun } from "lucide-react";
import { THEMES, type ThemeChoice } from "@/lib/theme";
import { useTheme } from "@/contexts/ThemeContext";

const ICONS: Record<ThemeChoice, typeof Moon> = {
  dark: Moon,
  light: Sun,
  system: Monitor,
};

export function ThemeToggle() {
  const { choice, cycle } = useTheme();
  const current = THEMES.find((theme) => theme.id === choice) ?? THEMES[0];
  const Icon = ICONS[current.id];

  return (
    <button
      type="button"
      className="flex size-7 shrink-0 items-center justify-center"
      aria-label={`Color theme, ${current.label}. Activate to change.`}
      title={`${current.label} theme`}
      onClick={cycle}
    >
      <Icon size={15} />
    </button>
  );
}
