import { SearchIcon, XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function focusLibrarySearch() {
  const nodes = document.querySelectorAll<HTMLInputElement>("[data-library-search]");
  for (const node of nodes) {
    if (node.getClientRects().length > 0) {
      node.focus();
      return;
    }
  }
  nodes[0]?.focus();
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Search your shelf…",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        data-library-search=""
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label="Search books"
        className="pr-10 pl-8"
      />
      {value ? (
        <button
          type="button"
          className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
          onClick={() => onChange("")}
          aria-label="Clear search"
        >
          <XIcon className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
