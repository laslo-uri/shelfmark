import { useEffect, type RefObject } from "react";
import { Download, Menu, Minus, PlusIcon, Search, Square, Upload, X } from "lucide-react";
import { ExportImport } from "@/features/backup/ExportImport";
import { ThemeToggle } from "@/features/settings/ThemeToggle";
import { useMinWidth } from "@/hooks/useMediaQuery";
import { bindWindowControls, isTauri } from "@/lib/desktop";
import { APP_VERSION } from "@/lib/version";
import type { LibraryFile } from "@/types";

export function TopBar({
  onAdd,
  onPalette,
  onExport,
  onImport,
  importRef,
  showMenu,
  onMenu,
}: {
  onAdd: () => void;
  onPalette: () => void;
  onExport: () => Promise<unknown>;
  onImport: (data: LibraryFile, options: { replace: boolean }) => Promise<unknown>;
  importRef: RefObject<HTMLInputElement | null>;
  showMenu?: boolean;
  onMenu?: () => void;
}) {
  const tauri = isTauri();
  const showLabels = useMinWidth(tauri ? 1000 : 640);

  useEffect(() => {
    if (tauri) void bindWindowControls();
  }, [tauri]);

  return (
    <header className="flex h-10 shrink-0 items-center gap-1.5 border-b border-border bg-card pr-1">
      {showMenu ? (
        <button type="button" className="ml-1 flex size-7 shrink-0 items-center justify-center" aria-label="Open library" onClick={onMenu}>
          <Menu size={16} />
        </button>
      ) : null}
      <div data-tauri-drag-region className="flex h-full shrink-0 items-center gap-2 pl-2">
        <img src="/favicon.svg" alt="" className="size-4" />
        <span className={`${showLabels ? "inline" : "hidden"} text-[13px] font-medium`}>Shelfmark</span>
        <span className={`${showLabels ? "inline" : "hidden"} text-[11px] text-muted-foreground`}>v{APP_VERSION}</span>
      </div>
      <ExportImport onExport={onExport} onImport={onImport} importRef={importRef}>
        {(actions) => (
          <>
            <div data-tauri-drag-region className="h-full min-w-2 flex-1" />
            <button type="button" className="flex h-7 shrink-0 items-center gap-1 rounded px-2 text-[12px] text-muted-foreground" aria-label="Commands" title="Commands (Ctrl+K)" onClick={onPalette}>
              <Search size={14} />
              <span className="hidden min-[1100px]:inline">Ctrl+K</span>
            </button>
            <ThemeToggle />
            <button type="button" className="flex h-7 shrink-0 items-center gap-1 rounded px-1.5 text-[12px] text-muted-foreground" aria-label="Export" title="Export library" onClick={actions.exportLibrary}>
              <Download size={14} />
              <span className="hidden min-[1100px]:inline">Export</span>
            </button>
            <button type="button" className="flex h-7 shrink-0 items-center gap-1 rounded px-1.5 text-[12px] text-muted-foreground" aria-label="Import" title="Import library" onClick={actions.importLibrary}>
              <Upload size={14} />
              <span className="hidden min-[1100px]:inline">Import</span>
            </button>
            <button type="button" className="flex size-7 shrink-0 items-center justify-center" aria-label="Add book" title="Add book" onClick={onAdd}>
              <PlusIcon size={15} />
            </button>
          </>
        )}
      </ExportImport>
      {tauri ? <WindowControls /> : null}
    </header>
  );
}

function WindowControls() {
  return (
    <div className="flex shrink-0">
      <button type="button" id="titlebar-minimize" className="flex h-10 w-10 items-center justify-center" aria-label="Minimize">
        <Minus size={14} />
      </button>
      <button type="button" id="titlebar-maximize" className="flex h-10 w-10 items-center justify-center" aria-label="Maximize">
        <Square size={12} />
      </button>
      <button type="button" id="titlebar-close" className="flex h-10 w-10 items-center justify-center" aria-label="Close">
        <X size={14} />
      </button>
    </div>
  );
}
