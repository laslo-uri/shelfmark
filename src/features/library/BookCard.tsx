import type { Book } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function BookCover({ book, className }: { book: Pick<Book, "coverUrl" | "title">; className?: string }) {
  if (book.coverUrl) {
    return <img src={book.coverUrl} alt="" className={cn("aspect-[2/3] w-full rounded-md bg-secondary object-cover", className)} />;
  }
  return (
    <div aria-hidden="true" className={cn("flex aspect-[2/3] w-full items-center justify-center rounded-md bg-secondary px-2 text-center text-xs text-muted-foreground", className)}>
      {book.title || "No cover"}
    </div>
  );
}

export function StarRating({ rating, onChange, className }: { rating: number; onChange?: (rating: number) => void; className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-0.5", className)} role="radiogroup" aria-label="Rating">
      {Array.from({ length: 5 }, (_, index) => {
        const value = index + 1;
        const active = value <= rating;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={rating === value}
            aria-label={`${value} star${value === 1 ? "" : "s"}`}
            className={cn("text-lg leading-none", active ? "text-primary" : "text-muted-foreground")}
            onClick={(event) => {
              event.stopPropagation();
              onChange?.(value === rating ? 0 : value);
            }}
          >
            {active ? "★" : "☆"}
          </button>
        );
      })}
    </div>
  );
}

export function BookCard({ book, onOpen, layout = "grid" }: { book: Book; onOpen: (book: Book) => void; layout?: "grid" | "list" }) {
  const title = book.title || "Untitled";
  const authors = book.authors?.join(", ") || "Unknown author";
  if (layout === "list") {
    return (
      <article className="flex min-w-0 items-center gap-3 rounded-lg border bg-card p-2 text-left shadow-sm">
        <button type="button" onClick={() => onOpen(book)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <BookCover book={book} className="w-12 shrink-0" />
          <span className="min-w-0">
            <span className="block truncate font-medium">{title}</span>
            <span className="mt-0.5 block truncate text-sm text-muted-foreground">{authors}</span>
          </span>
        </button>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <StarRating rating={book.rating || 0} />
          <Badge variant="secondary">{book.status}</Badge>
        </div>
      </article>
    );
  }
  return (
    <article className="min-w-0 rounded-lg border bg-card p-3 text-left shadow-sm">
      <button type="button" onClick={() => onOpen(book)} className="w-full text-left">
        <BookCover book={book} />
        <p className="mt-3 line-clamp-2 font-medium break-words">{title}</p>
        <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{authors}</p>
      </button>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <StarRating rating={book.rating || 0} />
        <Badge variant="secondary">{book.status}</Badge>
      </div>
    </article>
  );
}
