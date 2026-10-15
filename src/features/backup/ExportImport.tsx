import { useRef, useState, type ReactNode, type RefObject } from "react";
import { downloadJson } from "@/lib/download";
import { MAX_IMPORT_BYTES, parseLibraryText } from "@/lib/bookData";
import { useToast } from "@/contexts/ToastContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { LibraryFile } from "@/types";

export function ExportImport({
  onExport,
  onImport,
  importRef,
  children,
}: {
  onExport: () => Promise<unknown>;
  onImport: (data: LibraryFile, options: { replace: boolean }) => Promise<unknown>;
  importRef?: RefObject<HTMLInputElement | null>;
  children: (actions: { exportLibrary: () => void; importLibrary: () => void }) => ReactNode;
}) {
  const { toast } = useToast();
  const localRef = useRef<HTMLInputElement>(null);
  const fileRef = importRef ?? localRef;
  const [pending, setPending] = useState<LibraryFile | null>(null);
  const [importing, setImporting] = useState(false);

  async function handleExport() {
    try {
      const data = await onExport();
      await downloadJson(`shelfmark-library-${new Date().toISOString().slice(0, 10)}.json`, data);
      toast("Library exported.", "success");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      toast("Export failed.", "error");
    }
  }

  async function finishImport(replace: boolean) {
    if (!pending || importing) return;
    setImporting(true);
    try {
      const result = await onImport(pending, { replace });
      toast(`${replace ? "Library replaced." : "Library merged."}${importSummary(result)}`, "success");
    } catch (err) {
      toast(err instanceof Error && err.message ? `Import failed: ${err.message}` : "Import failed.", "error");
    } finally {
      setImporting(false);
      setPending(null);
    }
  }

  return (
    <>
      {children({
        exportLibrary: () => { void handleExport(); },
        importLibrary: () => fileRef.current?.click(),
      })}
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        aria-label="Import library file"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          if (file.size > MAX_IMPORT_BYTES) {
            toast("That file is too large to import.", "error");
            return;
          }
          void file.text().then((text) => {
            setPending(parseLibraryText(text));
          }).catch((err: unknown) => toast(err instanceof Error ? err.message : "Invalid library file.", "error"));
        }}
      />
      <Dialog open={pending != null} onOpenChange={(open) => { if (!open && !importing) setPending(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import library</DialogTitle>
            <DialogDescription>
              {pending?.books?.length ?? 0} {pending?.books?.length === 1 ? "book" : "books"} in this file.
              Merge keeps the books already on your shelf. Replace clears the shelf first.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="secondary" disabled={importing} onClick={() => { void finishImport(false); }}>Merge</Button>
            <Button type="button" variant="danger" disabled={importing} onClick={() => { void finishImport(true); }}>Replace</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function importSummary(result: unknown): string {
  if (!result || typeof result !== "object") return "";
  const { added, updated, skipped } = result as { added?: number; updated?: number; skipped?: number };
  const parts = [
    added ? `${added} added` : "",
    updated ? `${updated} updated` : "",
    skipped ? `${skipped} skipped` : "",
  ].filter(Boolean);
  return parts.length ? ` ${parts.join(", ")}.` : "";
}
