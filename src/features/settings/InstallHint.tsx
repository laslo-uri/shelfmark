import { installHintForPlatform } from "@/lib/platform";

export function InstallHint() {
  const hint = installHintForPlatform();
  if (!hint) return null;
  return <p className="rounded-md border bg-card px-3 py-2 text-sm text-muted-foreground">{hint}</p>;
}
