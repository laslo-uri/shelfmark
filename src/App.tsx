import { lazy, Suspense, useRef, useState } from "react";
import { downloadJson } from "@/lib/download";
import { useToast } from "@/contexts/ToastContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useShortcuts } from "@/features/command/useShortcuts";
import { Bookshelf, type ShelfActions } from "@/features/library/Bookshelf";
import { useMaxWidth } from "@/hooks/useMediaQuery";
import { StatusFooter } from "@/shell/StatusFooter";
import { TopBar } from "@/shell/TopBar";

// cmdk and the palette are only needed once someone opens it.
const CommandPalette = lazy(() => import("@/features/command/CommandPalette").then((m) => ({ default: m.CommandPalette })));

export function App() {
  const { toast } = useToast();
  const { cycle } = useTheme();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [scanOnOpen, setScanOnOpen] = useState(false);
  const searchFocus = useRef<() => void>(() => {});
  const importRef = useRef<HTMLInputElement>(null);
  const actionsRef = useRef<ShelfActions | null>(null);
  const narrow = useMaxWidth(900);
  const overlayOpen = paletteOpen || addOpen;

  async function exportLibrary() {
    const data = await actionsRef.current?.exportData();
    if (!data) return;
    await downloadJson(`shelfmark-library-${new Date().toISOString().slice(0, 10)}.json`, data);
    toast("Library exported.", "success");
  }

  useShortcuts({
    palette: () => setPaletteOpen(true),
    addBook: () => {
      setScanOnOpen(false);
      setAddOpen(true);
    },
    search: () => {
      if (!overlayOpen) searchFocus.current();
    },
    // Close the topmost layer only: palette, then the add sheet, then the open book.
    escape: () => {
      if (paletteOpen) {
        setPaletteOpen(false);
        return;
      }
      if (addOpen) {
        setAddOpen(false);
        return;
      }
      if (document.querySelector('[role="dialog"][data-state="open"], [role="listbox"][data-state="open"]')) return;
      actionsRef.current?.closeDetail();
    },
    exportLibrary: () => { void exportLibrary().catch(() => toast("Export failed.", "error")); },
    importLibrary: () => importRef.current?.click(),
    moveSelection: (delta) => {
      if (!overlayOpen) actionsRef.current?.move(delta);
    },
    toggleInspector: () => window.dispatchEvent(new Event("shelfmark:toggle-inspector")),
  });

  return (
    <div className="flex h-dvh min-h-0 flex-col bg-background text-[13px] text-foreground">
      <TopBar
        showMenu={narrow}
        onMenu={() => window.dispatchEvent(new Event("shelfmark:toggle-inspector:open-rail"))}
        onAdd={() => { setScanOnOpen(false); setAddOpen(true); }}
        onPalette={() => setPaletteOpen(true)}
        onExport={async () => actionsRef.current?.exportData()}
        onImport={async (data, options) => {
          if (!actionsRef.current) throw new Error("Library is still loading.");
          return actionsRef.current.importData(data, options);
        }}
        importRef={importRef}
      />
      <main id="bookshelf-main" className="flex min-h-0 flex-1 flex-col text-[13px]">
        <Bookshelf
          actionsRef={actionsRef}
          addOpen={addOpen}
          scanOnOpen={scanOnOpen}
          onAddOpenChange={setAddOpen}
          onRegisterSearch={(focus) => { searchFocus.current = focus; }}
          onDetailOpenChange={setDetailOpen}
        />
      </main>
      <StatusFooter />
      {paletteOpen ? (
        <Suspense fallback={null}>
          <CommandPalette
            open={paletteOpen}
            detailOpen={detailOpen}
            onClose={() => setPaletteOpen(false)}
            onAddBook={() => { setScanOnOpen(false); setAddOpen(true); }}
            onScan={() => { setScanOnOpen(true); setAddOpen(true); }}
            onToggleTheme={cycle}
            onSearch={() => searchFocus.current()}
            onFilter={(status) => actionsRef.current?.filter(status)}
            onSort={(sort) => actionsRef.current?.sort(sort)}
            onExport={() => { void exportLibrary().catch(() => toast("Export failed.", "error")); }}
            onImport={() => importRef.current?.click()}
            onSetStatus={(status) => actionsRef.current?.setStatus(status)}
            onRate={(rating) => actionsRef.current?.rate(rating)}
            onDelete={() => actionsRef.current?.removeSelected()}
          />
        </Suspense>
      ) : null}
    </div>
  );
}
