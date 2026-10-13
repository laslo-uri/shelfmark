import { useState } from "react";
import { Button } from "@/components/ui/button";

export function Onboarding({ storageKey, title, steps }: { storageKey: string; title: string; steps: string[] }) {
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem(storageKey) !== "1";
    } catch {
      return true;
    }
  });
  if (!open) return null;
  return (
    <section className="rounded-lg border bg-card p-4" aria-label={title}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="font-display text-base font-semibold">{title}</h2>
        <Button type="button" variant="ghost" size="sm" onClick={() => {
          try { localStorage.setItem(storageKey, "1"); } catch { /* private mode */ }
          setOpen(false);
        }}>Got it</Button>
      </div>
      <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
        {steps.map((step) => <li key={step}>{step}</li>)}
      </ol>
    </section>
  );
}
