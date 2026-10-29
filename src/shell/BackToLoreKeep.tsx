import { ChevronLeft } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { openLoreKeep } from "@/lib/desktop";

/** Far-left title bar button that returns to the LoreKeep lobby. Render it only inside the Tauri shell. */
export function BackToLoreKeep({ showLabel }: { showLabel: boolean }) {
  const { toast } = useToast();

  async function goBack() {
    try {
      await openLoreKeep();
    } catch (error) {
      toast(error instanceof Error ? error.message : String(error || "Could not open LoreKeep"), "error");
    }
  }

  return (
    <button
      type="button"
      className="ml-1 flex h-7 shrink-0 items-center gap-1 rounded pl-1 pr-1.5 text-[12px] text-muted-foreground"
      title="Back to LoreKeep"
      aria-label="Back to LoreKeep"
      onClick={() => void goBack()}
    >
      <ChevronLeft size={14} />
      <img src="/lorekeep.svg" alt="" className="size-4" />
      <span className={showLabel ? "inline" : "hidden"}>LoreKeep</span>
    </button>
  );
}
