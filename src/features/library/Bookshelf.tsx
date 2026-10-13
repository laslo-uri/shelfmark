import { useRef, useState, type RefObject } from "react";
import { LayoutGridIcon, ListIcon } from "lucide-react";
import { lookupIsbn } from "@/api/bookLookup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/contexts/ToastContext";
import { getBook, isDuplicateError } from "@/db/db";
import { AddBookSheet } from "@/features/scanner/AddBookSheet";
import { BookCard, BookCover } from "@/features/library/BookCard";
import { Onboarding } from "@/features/settings/Onboarding";
import { InstallHint } from "@/features/settings/InstallHint";
import { useLibrary } from "@/hooks/useLibrary";
import { toIsbn13 } from "@/lib/isbn";
import { STATUSES, bookStatus } from "@/lib/library";
import { stepIndex } from "@/lib/selection";
import type { Book, BookStatus, SortKey, StatusFilter } from "@/types";
import { BookDetail } from "@/features/book-detail/BookDetail";
import { WorkspaceFrame } from "@/shell/WorkspaceFrame";
import { cn } from "@/lib/utils";

export interface ShelfActions {
  filter: (status: StatusFilter) => void;
  sort: (sort: SortKey) => void;
  exportData: () => Promise<unknown>;
  importData: (data: import("@/types").LibraryFile, options?: { replace?: boolean }) => Promise<unknown>;
  add: (book: import("@/types").NewBook) => Promise<unknown>;
  selected: Book | null;
  setStatus: (status: BookStatus) => void;
  rate: (rating: number) => void;
  removeSelected: () => void;
  closeDetail: () => void;
  move: (delta: 1 | -1) => void;
}

export function Bookshelf({
  onRegisterSearch,
  addOpen,
  onAddOpenChange,
  scanOnOpen = false,
  actionsRef,
}: {
  onRegisterSearch?: (focus: () => void) => void;
  addOpen: boolean;
  onAddOpenChange: (open: boolean) => void;
  scanOnOpen?: boolean;
  actionsRef: RefObject<ShelfActions | null>;
}) {
  const library = useLibrary();
  const { toast } = useToast();
  const [selected, setSelected] = useState<Book | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [centerMode, setCenterMode] = useState<"grid" | "focus">("grid");
  const searchRef = useRef<HTMLInputElement>(null);
  onRegisterSearch?.(() => searchRef.current?.focus());

  const current = selected ? library.allBooks.find((book) => book.id === selected.id) ?? selected : null;
  actionsRef.current = {
    filter: library.setStatusFilter,
    sort: library.setSortBy,
    exportData: library.exportData,
    importData: library.importData,
    add: library.add,
    selected: current,
    setStatus: (status) => { if (current?.id != null) void library.update(current.id, { status }); },
    rate: (rating) => { if (current?.id != null) void library.update(current.id, { rating }); },
    removeSelected: () => { if (current?.id != null) void library.remove(current.id).then(() => setSelected(null)); },
    closeDetail: () => setSelected(null),
    move: (delta) => {
      const next = stepIndex(library.books.length, library.books.findIndex((book) => book.id === current?.id), delta);
      const book = library.books[next];
      if (!book) return;
      setSelected(book);
      setCenterMode("focus");
    },
  };

  const isbn = toIsbn13(library.searchQuery);

  function choose(book: Book) {
    setSelected(book);
    setCenterMode("focus");
  }

  async function lookUpIsbn() {
    if (!isbn) return;
    try {
      const found = await lookupIsbn(isbn);
      const id = await library.add(found);
      const saved = typeof id === "number" ? await getBook(id) : null;
      if (saved) choose(saved);
      toast("Added to your shelf.", "success");
    } catch (err) {
      if (isDuplicateError(err)) {
        choose(err.existing);
        toast("Already on your shelf.", "success");
        return;
      }
      toast(err instanceof Error ? err.message : "Lookup failed.", "error");
    }
  }

  const statusLabel = STATUSES.find((status) => status.id === bookStatus(current ?? { status: "unread" }))?.label ?? "Unread";

  return (
    <>
      <WorkspaceFrame
        storageId="shelfmark-workspace"
        toggleEvent="shelfmark:toggle-inspector"
        rail={(
          <aside className="flex h-full min-h-0 flex-col bg-card">
            <div className="flex flex-col gap-2 border-b p-2">
              <Input
                ref={searchRef}
                id="library-search"
                type="search"
                value={library.searchQuery}
                onChange={(event) => library.setSearchQuery(event.target.value)}
                placeholder="Search title, author, ISBN…"
                aria-label="Search library"
              />
              {isbn ? (
                <Button type="button" size="sm" className="h-7 text-[12px]" onClick={() => void lookUpIsbn()}>
                  Look up ISBN
                </Button>
              ) : null}
              <Select value={library.statusFilter} onValueChange={(value) => library.setStatusFilter(value as StatusFilter)}>
                <SelectTrigger aria-label="Filter by status" className="h-7 w-full text-[12px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {STATUSES.map((status) => <SelectItem key={status.id} value={status.id}>{status.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="min-h-0 flex-1 overflow-auto">
              {library.books.map((book) => (
                <button
                  key={book.id}
                  type="button"
                  className={cn("block w-full border-b px-2 py-1.5 text-left", current?.id === book.id && "bg-secondary")}
                  onClick={() => choose(book)}
                >
                  <span className="block truncate text-[13px]">{book.title || "Untitled"}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{(book.authors || []).join(", ")}</span>
                </button>
              ))}
            </div>
          </aside>
        )}
        center={(
          <div className="h-full min-h-0 overflow-auto">
            <div className="flex flex-col gap-3 px-4 py-3">
              <InstallHint />
              {library.isLoading ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4" role="status">
                  <span className="sr-only">Loading your shelf…</span>
                  {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-64" />)}
                </div>
              ) : library.count === 0 ? (
                <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed px-6 py-10 text-center">
                  <h1 className="font-display text-[13px] font-medium">Your shelf is empty</h1>
                  <p className="max-w-md text-muted-foreground">Scan an ISBN or type one in. The catalog stays on this device.</p>
                  <Button type="button" onClick={() => onAddOpenChange(true)}>Add a book</Button>
                </div>
              ) : centerMode === "focus" && current ? (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <div className="flex gap-1 self-end">
                    <Button type="button" size="sm" variant="ghost" className="h-7 text-[12px]" onClick={() => setCenterMode("grid")}>Grid</Button>
                  </div>
                  <div className="w-40"><BookCover book={current} /></div>
                  <h2 className="font-display text-[13px] font-medium">{current.title}</h2>
                  <p className="text-[12px] text-muted-foreground">{(current.authors || []).join(", ")}</p>
                  <p className="text-[12px]">{statusLabel}</p>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={library.sortBy} onValueChange={(value) => library.setSortBy(value as SortKey)}>
                      <SelectTrigger aria-label="Sort books" className="h-7 w-40 text-[12px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="added">Recently added</SelectItem>
                        <SelectItem value="title">Title</SelectItem>
                        <SelectItem value="author">Author</SelectItem>
                        <SelectItem value="rating">Rating</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex shrink-0 gap-1">
                      <Button type="button" size="icon" variant={view === "grid" ? "secondary" : "ghost"} aria-label="Grid view" onClick={() => { setView("grid"); setCenterMode("grid"); }}><LayoutGridIcon /></Button>
                      <Button type="button" size="icon" variant={view === "list" ? "secondary" : "ghost"} aria-label="List view" onClick={() => { setView("list"); setCenterMode("grid"); }}><ListIcon /></Button>
                    </div>
                  </div>
                  <div className={cn(view === "grid" ? "grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5" : "flex flex-col gap-2")}>
                    {library.books.map((book) => (
                      <BookCard key={book.id} book={book} layout={view} onOpen={choose} />
                    ))}
                  </div>
                </>
              )}
              <Onboarding
                storageKey="shelfmark-onboarding"
                title="Build your shelf"
                steps={[
                  "Scan an ISBN barcode, or type the number.",
                  "Mark each book unread, reading, or read.",
                  "Add tags and a rating, then export a backup when you want one.",
                ]}
              />
            </div>
          </div>
        )}
        inspector={current ? (
          <BookDetail
            layout="inspector"
            book={current}
            onClose={() => setSelected(null)}
            onUpdate={library.update}
            onRemove={library.remove}
          />
        ) : (
          <p className="p-4 text-[13px] text-muted-foreground">Select a book to edit notes, tags, and rating.</p>
        )}
      />
      <AddBookSheet
        open={addOpen}
        scanOnOpen={scanOnOpen}
        existingIsbns={new Set(library.allBooks.map((book) => book.isbn))}
        onClose={() => onAddOpenChange(false)}
        onSave={library.add}
      />
    </>
  );
}
