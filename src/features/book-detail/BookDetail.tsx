import { useEffect, useRef, useState } from "react";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BookCover, StarRating } from "@/features/library/BookCard";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { safeCoverUrl } from "@/lib/bookData";
import { readCoverFile } from "@/lib/coverImage";
import { STATUSES, bookStatus } from "@/lib/library";
import type { Book, BookStatus } from "@/types";

export function BookDetail({
  book,
  onClose,
  onUpdate,
  onRemove,
  layout = "page",
}: {
  book: Book;
  onClose: () => void;
  onUpdate: (id: number, updates: Partial<Book>) => Promise<unknown>;
  onRemove: (id: number) => Promise<unknown>;
  layout?: "page" | "inspector";
}) {
  const [notes, setNotes] = useState(book.notes ?? "");
  const [title, setTitle] = useState(book.title || "");
  const [authors, setAuthors] = useState((book.authors || []).join(", "));
  const [coverUrl, setCoverUrl] = useState(book.coverUrl || "");
  const [tagDraft, setTagDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const authorsKey = (book.authors || []).join(", ");
  const dirty = title !== (book.title || "")
    || authors !== authorsKey
    || coverUrl !== (book.coverUrl || "")
    || notes !== (book.notes ?? "");
  const coverInvalid = coverUrl.trim() !== "" && !safeCoverUrl(coverUrl);

  // Latest committed draft, read when this book is swapped out or unmounted.
  // Updated in an effect (not during render) so the cleanup below still sees
  // the previous book's draft when `book.id` changes.
  const draftRef = useRef<{ id?: number; dirty: boolean; updates: Partial<Book> }>({ dirty: false, updates: {} });
  const onUpdateRef = useRef(onUpdate);
  useEffect(() => {
    onUpdateRef.current = onUpdate;
    draftRef.current = { id: book.id, dirty: dirty && !coverInvalid, updates: draftUpdates() };
  });

  const embedded = layout === "inspector";
  useFocusTrap(overlayRef, !embedded, () => { void requestClose(); });

  // Autosave unsaved edits when the inspector switches to another book or closes.
  useEffect(() => () => {
    const draft = draftRef.current;
    if (draft.dirty && draft.id != null) void onUpdateRef.current(draft.id, draft.updates).catch(() => {});
  }, [book.id]);

  // Re-sync drafts only when the stored values change. `authors` is compared as a
  // string because every refetch hands us a new array, which used to wipe
  // in-progress edits whenever status, rating, or tags were saved.
  useEffect(() => {
    setNotes(book.notes ?? "");
    setTitle(book.title || "");
    setAuthors(authorsKey);
    setCoverUrl(book.coverUrl || "");
  }, [book.id, book.notes, book.title, authorsKey, book.coverUrl]);

  useEffect(() => {
    setConfirmDelete(false);
    setSaveError("");
  }, [book.id]);

  function draftUpdates(): Partial<Book> {
    return {
      notes,
      title: title.trim() || "Untitled",
      authors: authors.split(",").map((name) => name.trim()).filter(Boolean),
      coverUrl: coverUrl.trim(),
    };
  }

  async function patch(updates: Partial<Book>) {
    if (book.id == null) return;
    setSaveError("");
    try {
      await onUpdate(book.id, updates);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save changes.");
    }
  }

  async function saveDetails() {
    if (book.id == null) return false;
    if (coverInvalid) {
      setSaveError("Cover URL must start with https:// or http://.");
      return false;
    }
    setSaving(true);
    setSaveError("");
    try {
      await onUpdate(book.id, draftUpdates());
      return true;
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save changes.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function requestClose() {
    if (dirty) {
      const saved = await saveDetails();
      if (!saved) return;
    }
    onClose();
  }

  return (
    <div ref={overlayRef} className={embedded ? "h-full overflow-auto" : "min-h-0 flex-1 overflow-auto"} role={embedded ? undefined : "dialog"} aria-modal={embedded ? undefined : true} aria-label="Book details">
      <div className={embedded ? "flex flex-col gap-4 p-3" : "mx-auto flex max-w-3xl flex-col gap-6 px-4 py-4"}>
        {embedded ? null : (
          <Button type="button" variant="ghost" className="w-fit" onClick={() => void requestClose()}>Back</Button>
        )}
        <div className="grid gap-6 sm:grid-cols-[180px_1fr]">
          <BookCover book={{ ...book, coverUrl: safeCoverUrl(coverUrl), title }} />
          <div className="space-y-3">
            <label className="block text-sm">Title
              <Input className="mt-1 text-base" value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>
            <label className="block text-sm">Authors
              <Input className="mt-1 text-base" value={authors} onChange={(event) => setAuthors(event.target.value)} placeholder="Comma-separated" />
            </label>
          </div>
        </div>
        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold">Reading</h2>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Reading status">
            {STATUSES.map((status) => (
              <Button
                key={status.id}
                type="button"
                role="radio"
                aria-checked={bookStatus(book) === status.id}
                variant={bookStatus(book) === status.id ? "default" : "outline"}
                onClick={() => void patch({ status: status.id as BookStatus })}
              >
                {status.label}
              </Button>
            ))}
          </div>
          <StarRating rating={book.rating || 0} onChange={(rating) => void patch({ rating })} />
        </section>
        <label className="block text-sm">Notes
          <Textarea className="mt-1 text-base" value={notes} onChange={(event) => setNotes(event.target.value)} />
        </label>
        <label className="block text-sm">Cover URL
          <Input className="mt-1 text-base" type="url" inputMode="url" value={coverUrl} aria-invalid={coverInvalid || undefined} onChange={(event) => setCoverUrl(event.target.value)} />
        </label>
        <label className="block text-sm">Upload cover
          <Input className="mt-1 text-base" type="file" accept="image/*" onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            void readCoverFile(file).then(setCoverUrl).catch((err: unknown) => {
              setSaveError(err instanceof Error ? err.message : "Could not read that image.");
            });
          }} />
        </label>
        <form className="flex flex-wrap gap-2" onSubmit={(event) => {
          event.preventDefault();
          const tag = tagDraft.trim();
          if (!tag) return;
          setTagDraft("");
          void patch({ tags: [...new Set([...(book.tags || []), tag])] });
        }}>
          <Input className="min-w-0 flex-1" value={tagDraft} onChange={(event) => setTagDraft(event.target.value)} placeholder="Add a tag" aria-label="Add a tag" />
          <Button type="submit" variant="secondary">Add tag</Button>
        </form>
        {(book.tags || []).length ? (
          <ul className="flex flex-wrap gap-2" aria-label="Tags">
            {(book.tags || []).map((tag) => (
              <li key={tag} className="flex items-center gap-1 rounded-full bg-secondary py-1 pr-1 pl-2 text-xs">
                {tag}
                <button
                  type="button"
                  className="flex size-4 items-center justify-center rounded-full opacity-70 hover:opacity-100"
                  aria-label={`Remove tag ${tag}`}
                  onClick={() => void patch({ tags: (book.tags || []).filter((item) => item !== tag) })}
                >
                  <XIcon className="size-3" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {saveError ? <p className="text-sm text-destructive" role="alert">{saveError}</p> : null}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" className="w-full sm:w-auto" onClick={() => void saveDetails()} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          <Button type="button" className="w-full sm:w-auto" variant="danger" onClick={() => {
            if (!confirmDelete) {
              setConfirmDelete(true);
              return;
            }
            if (book.id == null) return;
            void onRemove(book.id).then(onClose).catch((err: unknown) => {
              setConfirmDelete(false);
              setSaveError(err instanceof Error ? err.message : "Could not remove this book.");
            });
          }}>{confirmDelete ? "Confirm remove" : "Remove"}</Button>
        </div>
      </div>
    </div>
  );
}
