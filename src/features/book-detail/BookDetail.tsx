import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BookCover, StarRating } from "@/features/library/BookCard";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { STATUSES, bookStatus } from "@/lib/library";
import type { Book, BookStatus } from "@/types";

async function compressCover(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 600 / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not read that image.");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.8);
}

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
  const dirty = title !== (book.title || "")
    || authors !== (book.authors || []).join(", ")
    || coverUrl !== (book.coverUrl || "")
    || notes !== (book.notes ?? "");

  const embedded = layout === "inspector";
  useFocusTrap(overlayRef, !embedded, () => { void requestClose(); });

  useEffect(() => {
    setNotes(book.notes ?? "");
    setTitle(book.title || "");
    setAuthors((book.authors || []).join(", "));
    setCoverUrl(book.coverUrl || "");
  }, [book.id, book.notes, book.title, book.authors, book.coverUrl]);

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
    setSaving(true);
    setSaveError("");
    try {
      await onUpdate(book.id, {
        notes,
        title: title.trim() || "Untitled",
        authors: authors.split(",").map((name) => name.trim()).filter(Boolean),
        coverUrl: coverUrl.trim(),
      });
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
          <BookCover book={{ ...book, coverUrl, title }} />
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
          <Input className="mt-1 text-base" value={coverUrl} onChange={(event) => setCoverUrl(event.target.value)} />
        </label>
        <label className="block text-sm">Upload cover
          <Input className="mt-1 text-base" type="file" accept="image/*" onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            void compressCover(file).then(setCoverUrl).catch((err: unknown) => {
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
        <div className="flex flex-wrap gap-2">{(book.tags || []).map((tag) => <span key={tag} className="rounded-full bg-secondary px-2 py-1 text-xs">{tag}</span>)}</div>
        {saveError ? <p className="text-sm text-destructive" role="alert">{saveError}</p> : null}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" className="w-full sm:w-auto" onClick={() => void saveDetails()} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          <Button type="button" className="w-full sm:w-auto" variant="danger" onClick={() => {
            if (!confirmDelete) {
              setConfirmDelete(true);
              return;
            }
            if (book.id == null) return;
            void onRemove(book.id).then(onClose);
          }}>{confirmDelete ? "Confirm remove" : "Remove"}</Button>
        </div>
      </div>
    </div>
  );
}
