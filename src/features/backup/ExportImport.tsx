import { useRef, useState, type ReactNode, type RefObject } from "react";
import { downloadJson } from "@/lib/download";
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
    if (!pending) return;
    try {
      await onImport(pending, { replace });
      toast(replace ? "Library replaced." : "Library merged.", "success");
    } catch {
      toast("Import failed.", "error");
    } finally {
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
          void file.text().then((text) => {
            setPending(JSON.parse(text) as LibraryFile);
          }).catch(() => toast("Invalid library file.", "error"));
        }}
      />
      <Dialog open={pending != null} onOpenChange={(open) => { if (!open) setPending(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import library</DialogTitle>
            <DialogDescription>Merge keeps the books already on your shelf. Replace clears the shelf first.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => { void finishImport(false); }}>Merge</Button>
            <Button type="button" variant="danger" onClick={() => { void finishImport(true); }}>Replace</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
