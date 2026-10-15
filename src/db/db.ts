import Dexie, { type Table } from "dexie";
import type { Book, LibraryExport, LibraryFile, NewBook } from "@/types";
import { normalizeRating, normalizeStatus, safeCoverUrl, sanitizeBook } from "@/lib/bookData";

class ShelfmarkDatabase extends Dexie {
  books!: Table<Book, number>;

  constructor() {
    super("shelfmark");
    this.version(1).stores({
      books: "++id, isbn, title, addedAt",
    });
  }
}

export const db = new ShelfmarkDatabase();

export class DuplicateBookError extends Error {
  code = "DUPLICATE" as const;
  existing: Book;

  constructor(existing: Book) {
    super("Already on your shelf");
    this.name = "DuplicateBookError";
    this.existing = existing;
  }
}

export function isDuplicateError(error: unknown): error is DuplicateBookError {
  return error instanceof DuplicateBookError;
}

export async function getAllBooks(): Promise<Book[]> {
  return db.books.orderBy("addedAt").reverse().toArray();
}

export async function getBookByIsbn(isbn: string): Promise<Book | undefined> {
  return db.books.where("isbn").equals(isbn).first();
}

export async function getBook(id: number): Promise<Book | undefined> {
  return db.books.get(id);
}

export async function addBook(book: NewBook): Promise<number> {
  const record = sanitizeBook({ ...book, addedAt: Date.now() });
  if (!record) throw new Error("Invalid ISBN");
  // Check and insert atomically so a double-submit cannot create two copies.
  return db.transaction("rw", db.books, async () => {
    const existing = await getBookByIsbn(record.isbn);
    if (existing) throw new DuplicateBookError(existing);
    return db.books.add(record as Book);
  });
}

export async function updateBook(id: number, updates: Partial<Book>): Promise<number> {
  const safe: Partial<Book> = { ...updates };
  delete safe.id;
  if ("coverUrl" in safe) safe.coverUrl = safeCoverUrl(safe.coverUrl);
  if ("status" in safe) safe.status = normalizeStatus(safe.status);
  if ("rating" in safe) safe.rating = normalizeRating(safe.rating);
  const updated = await db.books.update(id, safe);
  if (!updated) throw new Error("Could not save changes.");
  return updated;
}

export async function removeBook(id: number): Promise<void> {
  await db.books.delete(id);
}

/** Puts a just-removed book back with its original id and timestamps (undo). */
export async function restoreBook(book: Book): Promise<number> {
  return db.books.put(book);
}

export async function exportLibrary(): Promise<LibraryExport> {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    books: await getAllBooks(),
  };
}

export interface ImportResult {
  added: number;
  updated: number;
  skipped: number;
}

export async function importLibrary(data: LibraryFile, { replace = false } = {}): Promise<ImportResult> {
  if (!data?.books || !Array.isArray(data.books)) {
    throw new Error("Invalid library file");
  }

  const result: ImportResult = { added: 0, updated: 0, skipped: 0 };
  const now = Date.now();
  const incoming = new Map<string, Omit<Book, "id">>();
  for (const raw of data.books) {
    const book = sanitizeBook(raw, now);
    if (!book) {
      result.skipped += 1;
      continue;
    }
    // Later duplicates in the same file win, matching the old "last write" behaviour.
    if (incoming.has(book.isbn)) result.skipped += 1;
    incoming.set(book.isbn, book);
  }

  await db.transaction("rw", db.books, async () => {
    if (replace) {
      await db.books.clear();
      await db.books.bulkAdd([...incoming.values()] as Book[]);
      result.added = incoming.size;
      return;
    }

    for (const book of incoming.values()) {
      const existing = await db.books.where("isbn").equals(book.isbn).first();
      if (!existing) {
        await db.books.add(book as Book);
        result.added += 1;
        continue;
      }
      // Merge keeps the shelf copy; only fill in notes it does not have yet.
      const existingNote = typeof existing.notes === "string" ? existing.notes.trim() : "";
      if (!existingNote && book.notes.trim() && existing.id != null) {
        await db.books.update(existing.id, { notes: book.notes });
        result.updated += 1;
      } else {
        result.skipped += 1;
      }
    }
  });
  return result;
}
