import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return <div className="flex h-dvh min-h-0 flex-col bg-background text-foreground">{children}</div>;
}
