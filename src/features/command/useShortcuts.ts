import { useEffect, useRef } from "react";
import { runShortcut, type ShortcutHandlers } from "@/features/command/shortcuts";

export function useShortcuts(handlers: ShortcutHandlers): void {
  const ref = useRef(handlers);
  ref.current = handlers;
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => runShortcut(event, ref.current);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
