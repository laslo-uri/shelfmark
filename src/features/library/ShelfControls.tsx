import type { ReactNode } from "react";
import { LayoutGridIcon, ListIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATUSES } from "@/lib/library";
import { cn } from "@/lib/utils";
import type { SortKey, StatusFilter } from "@/types";

const ALL = "__all__";

export function ShelfControls({
  sortBy,
  onSort,
  statusFilter,
  onStatus,
  tags,
  tagFilter,
  onTag,
  view,
  onView,
}: {
  sortBy: SortKey;
  onSort: (sort: SortKey) => void;
  statusFilter: StatusFilter;
  onStatus: (status: StatusFilter) => void;
  tags: string[];
  tagFilter: string;
  onTag: (tag: string) => void;
  view: "grid" | "list";
  onView: (view: "grid" | "list") => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 overflow-x-auto" role="radiogroup" aria-label="Filter by status">
        <StatusPill active={statusFilter === "all"} onClick={() => onStatus("all")}>
          All
        </StatusPill>
        {STATUSES.map((status) => (
          <StatusPill key={status.id} active={statusFilter === status.id} onClick={() => onStatus(status.id)}>
            {status.label}
          </StatusPill>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={sortBy} onValueChange={(value) => onSort(value as SortKey)}>
          <SelectTrigger aria-label="Sort books">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="added">Recently added</SelectItem>
            <SelectItem value="title">Title</SelectItem>
            <SelectItem value="author">Author</SelectItem>
            <SelectItem value="rating">Rating</SelectItem>
          </SelectContent>
        </Select>
        {tags.length > 0 ? (
          <Select value={tagFilter || ALL} onValueChange={(value) => onTag(value === ALL ? "" : value)}>
            <SelectTrigger aria-label="Filter by tag">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All tags</SelectItem>
              {tags.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
        <div className="ml-auto inline-flex rounded-md bg-secondary p-0.5" role="group" aria-label="Shelf layout">
          <ViewButton active={view === "grid"} onClick={() => onView("grid")} label="Grid" icon={<LayoutGridIcon className="size-4" />} />
          <ViewButton active={view === "list"} onClick={() => onView("list")} label="List" icon={<ListIcon className="size-4" />} />
        </div>
      </div>
    </div>
  );
}

function StatusPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      className={cn(
        "min-h-11 shrink-0 rounded-full px-3 text-sm sm:min-h-8",
        active ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function ViewButton({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 text-sm sm:min-h-8",
        active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
      )}
      onClick={onClick}
      aria-pressed={active}
    >
      {icon}
      {label}
    </button>
  );
}
