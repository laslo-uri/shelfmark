import { useEffect, useRef, useState } from "react";
import { createManualBook, lookupIsbn } from "@/api/bookLookup";
import { DuplicateBookError } from "@/db/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { BookCover } from "@/features/library/BookCard";
import { BarcodeScanner } from "@/features/scanner/BarcodeScanner";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { toIsbn13 } from "@/lib/isbn";
import type { LookupBook, NewBook } from "@/types";

export function AddBookSheet({
  open,
  onClose,
  onSave,
  existingIsbns,
  scanOnOpen = false,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (book: NewBook) => Promise<unknown>;
  existingIsbns: Set<string>;
  scanOnOpen?: boolean;
}) {
  const [isbnInput, setIsbnInput] = useState("");
  const [preview, setPreview] = useState<LookupBook | null>(null);
  const [manualTitle, setManualTitle] = useState("");
  const [manualAuthors, setManualAuthors] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  // Bumped on every lookup and on close so a slow response cannot overwrite a newer one.
  const requestRef = useRef(0);
  useFocusTrap(sheetRef, open && !scannerOpen);

  useEffect(() => {
    if (!open) {
      requestRef.current += 1;
      setSaving(false);
      setIsbnInput("");
      setPreview(null);
      setManualTitle("");
      setManualAuthors("");
      setLoading(false);
      setError(null);
      setInfo(null);
      setScannerOpen(false);
      return;
    }
    if (scanOnOpen) setScannerOpen(true);
  }, [open, scanOnOpen]);

  async function lookup(raw: string) {
    const request = ++requestRef.current;
    setLoading(true);
    setError(null);
    setInfo(null);
    const isbn13 = toIsbn13(raw);
    if (!isbn13) {
      setError("Invalid ISBN — check the number and try again.");
      setPreview(null);
      setLoading(false);
      return;
    }
    setIsbnInput(isbn13);
    if (existingIsbns.has(isbn13)) {
      setError("Already on your shelf");
      setPreview(null);
      setLoading(false);
      return;
    }
    try {
      const book = await lookupIsbn(isbn13);
      if (request !== requestRef.current) return;
      setPreview(book);
      setManualTitle(book.title);
      setManualAuthors(book.authors.join(", "));
      if (!book.title.trim()) setInfo("No title found online. Enter one below.");
    } catch {
      if (request !== requestRef.current) return;
      const book = createManualBook(isbn13);
      setPreview(book);
      setInfo("Could not reach book databases. Enter the title manually.");
    } finally {
      if (request === requestRef.current) setLoading(false);
    }
  }

  async function handleSave() {
    if (!preview || saving) return;
    const title = (manualTitle || preview.title || "").trim();
    if (!title) {
      setError("Please enter a title for this book.");
      return;
    }
    const authors = manualAuthors.split(",").map((name) => name.trim()).filter(Boolean);
    setSaving(true);
    try {
      await onSave({ ...preview, title, authors });
      onClose();
    } catch (err) {
      setError(err instanceof DuplicateBookError ? "Already on your shelf" : err instanceof Error ? err.message : "Could not save book.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <SheetContent ref={sheetRef} className="overflow-y-auto" aria-describedby={undefined}>
        <SheetHeader>
          <SheetTitle>Add a book</SheetTitle>
        </SheetHeader>
        <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); void lookup(isbnInput); }}>
          <label className="block text-sm">ISBN
            <Input className="mt-1" value={isbnInput} onChange={(event) => setIsbnInput(event.target.value)} aria-label="ISBN" inputMode="numeric" />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={loading}>{loading ? "Looking up…" : "Look up"}</Button>
            <Button type="button" variant="secondary" onClick={() => setScannerOpen(true)}>Scan barcode</Button>
          </div>
          {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
          {info ? <p className="text-sm text-muted-foreground">{info}</p> : null}
        </form>
        {scannerOpen ? (
          <div>
            <BarcodeScanner active={scannerOpen} onClose={() => setScannerOpen(false)} onDetected={(value) => { setScannerOpen(false); void lookup(value); }} />
          </div>
        ) : null}
        {preview ? (
          <div className="space-y-3 border-t pt-4">
            <BookCover book={preview} className="max-w-36" />
            <label className="block text-sm">Title
              <Input className="mt-1" value={manualTitle} onChange={(event) => setManualTitle(event.target.value)} />
            </label>
            <label className="block text-sm">Authors
              <Input className="mt-1" value={manualAuthors} onChange={(event) => setManualAuthors(event.target.value)} />
            </label>
            <Button type="button" disabled={saving} onClick={() => void handleSave()}>{saving ? "Adding…" : "Add to shelf"}</Button>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
