import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import type { BookStatus } from "@/types";

interface CommandPaletteProps {
  open: boolean;
  detailOpen: boolean;
  onClose: () => void;
  onAddBook: () => void;
  onScan: () => void;
  onToggleTheme: () => void;
  onSearch: () => void;
  onFilter: (status: "all" | BookStatus) => void;
  onSort: (sort: "added" | "title" | "author" | "rating") => void;
  onExport: () => void;
  onImport: () => void;
  onSetStatus?: (status: BookStatus) => void;
  onRate?: (rating: number) => void;
  onDelete?: () => void;
}

export function CommandPalette(props: CommandPaletteProps) {
  if (!props.open) return null;
  const commands: Array<{ label: string; run: () => void; detailOnly?: boolean }> = [
    { label: "Add book", run: props.onAddBook },
    { label: "Scan barcode", run: props.onScan },
    { label: "Toggle theme", run: props.onToggleTheme },
    { label: "Search library", run: props.onSearch },
    { label: "Filter unread", run: () => props.onFilter("unread") },
    { label: "Filter reading", run: () => props.onFilter("reading") },
    { label: "Filter read", run: () => props.onFilter("read") },
    { label: "Filter all", run: () => props.onFilter("all") },
    { label: "Sort by added", run: () => props.onSort("added") },
    { label: "Sort by title", run: () => props.onSort("title") },
    { label: "Sort by author", run: () => props.onSort("author") },
    { label: "Sort by rating", run: () => props.onSort("rating") },
    { label: "Export library", run: props.onExport },
    { label: "Import library", run: props.onImport },
    { label: "Set status unread", run: () => props.onSetStatus?.("unread"), detailOnly: true },
    { label: "Set status reading", run: () => props.onSetStatus?.("reading"), detailOnly: true },
    { label: "Set status read", run: () => props.onSetStatus?.("read"), detailOnly: true },
    { label: "Rate 1", run: () => props.onRate?.(1), detailOnly: true },
    { label: "Rate 2", run: () => props.onRate?.(2), detailOnly: true },
    { label: "Rate 3", run: () => props.onRate?.(3), detailOnly: true },
    { label: "Rate 4", run: () => props.onRate?.(4), detailOnly: true },
    { label: "Rate 5", run: () => props.onRate?.(5), detailOnly: true },
    { label: "Delete book", run: () => props.onDelete?.(), detailOnly: true },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/45" onMouseDown={props.onClose}>
      <Command
        label="Command palette"
        className="absolute top-4 left-1/2 flex max-h-[calc(100%-2rem)] w-[min(560px,calc(100%-2rem))] -translate-x-1/2 flex-col overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <CommandInput autoFocus placeholder="Type a command" />
        <CommandList>
          <CommandEmpty>No matches.</CommandEmpty>
          <CommandGroup heading="Commands">
            {commands.map((command) => {
              const disabled = Boolean(command.detailOnly && !props.detailOpen);
              return (
                <CommandItem
                  key={command.label}
                  value={command.label}
                  disabled={disabled}
                  onSelect={() => {
                    if (disabled) return;
                    command.run();
                    props.onClose();
                  }}
                >
                  {command.label}
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  );
}
