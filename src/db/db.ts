import Dexie, { type Table } from "dexie";
import type { Book, LibraryExport, LibraryFile, NewBook } from "@/types";

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
  const existing = await getBookByIsbn(book.isbn);
  if (existing) throw new DuplicateBookError(existing);

  return db.books.add({
    isbn: book.isbn,
    title: book.title ?? "",
    authors: book.authors ?? [],
    publisher: book.publisher ?? "",
    publishDate: book.publishDate ?? "",
    description: book.description ?? "",
    coverUrl: book.coverUrl ?? "",
    notes: book.notes ?? "",
    status: book.status || "unread",
    rating: book.rating ?? 0,
    tags: Array.isArray(book.tags) ? book.tags : [],
    addedAt: Date.now(),
  } as Book);
}

export async function updateBook(id: number, updates: Partial<Book>): Promise<number> {
  const updated = await db.books.update(id, updates);
  if (!updated) throw new Error("Could not save changes.");
  return updated;
}

export async function removeBook(id: number): Promise<void> {
  await db.books.delete(id);
}

export async function exportLibrary(): Promise<LibraryExport> {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    books: await getAllBooks(),
  };
}

export async function importLibrary(data: LibraryFile, { replace = false } = {}): Promise<void> {
  if (!data?.books || !Array.isArray(data.books)) {
    throw new Error("Invalid library file");
  }

  await db.transaction("rw", db.books, async () => {
    if (replace) await db.books.clear();

    for (const book of data.books ?? []) {
      if (!book.isbn) continue;
      const existing = await db.books.where("isbn").equals(book.isbn).first();
      if (existing && !replace) {
        const incomingNote = typeof book.notes === "string" ? book.notes.trim() : "";
        const existingNote = typeof existing.notes === "string" ? existing.notes.trim() : "";
        if (!existingNote && incomingNote) {
          await db.books.update(existing.id as number, { notes: book.notes });
        }
        continue;
      }

      const rest = { ...book };
      delete rest.id;
      if (existing?.id != null) {
        await db.books.update(existing.id, rest);
      } else {
        await db.books.add({
          isbn: rest.isbn,
          title: rest.title ?? "",
          authors: rest.authors ?? [],
          publisher: rest.publisher ?? "",
          publishDate: rest.publishDate ?? "",
          description: rest.description ?? "",
          coverUrl: rest.coverUrl ?? "",
          notes: rest.notes ?? "",
          status: rest.status || "unread",
          rating: rest.rating ?? 0,
          tags: rest.tags ?? [],
          addedAt: rest.addedAt ?? Date.now(),
        } as Book);
      }
    }
  });
}
