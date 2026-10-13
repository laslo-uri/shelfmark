import { useRef, useState } from "react";
import { downloadJson } from "@/lib/download";
import { useToast } from "@/contexts/ToastContext";
import { useTheme } from "@/contexts/ThemeContext";
import { CommandPalette } from "@/features/command/CommandPalette";
import { useShortcuts } from "@/features/command/useShortcuts";
import { Bookshelf, type ShelfActions } from "@/features/library/Bookshelf";
import { useMaxWidth } from "@/hooks/useMediaQuery";
import { StatusFooter } from "@/shell/StatusFooter";
import { TopBar } from "@/shell/TopBar";

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
    search: () => searchFocus.current(),
    escape: () => {
      if (actionsRef.current?.selected) {
        actionsRef.current.closeDetail();
        return;
      }
      if (addOpen) {
        setAddOpen(false);
        return;
      }
      if (paletteOpen) setPaletteOpen(false);
    },
    exportLibrary: () => { void exportLibrary().catch(() => toast("Export failed.", "error")); },
    importLibrary: () => importRef.current?.click(),
    moveSelection: (delta) => actionsRef.current?.move(delta),
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
          await actionsRef.current?.importData(data, options);
          toast(options.replace ? "Library replaced." : "Library merged.", "success");
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
    </div>
  );
}
