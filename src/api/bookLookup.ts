import type { LookupBook } from "@/types";
import { coverUrl, toIsbn13 } from "@/lib/isbn";

const API_BASE = "https://openlibrary.org/api/books";
const GOOGLE_BOOKS_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY ?? "";
const JUNK_TITLE = /please verify|just a moment|access denied|page not found|isbn search/i;

interface Named {
  name?: string;
}

function parseAuthors(authors: Array<string | Named> = []): string[] {
  return authors.map((author) => (typeof author === "string" ? author : author?.name)).filter((name): name is string => Boolean(name));
}

function emptyBook(isbn13: string): LookupBook {
  return {
    isbn: isbn13,
    title: "",
    authors: [],
    publisher: "",
    publishDate: "",
    description: "",
    coverUrl: coverUrl(isbn13),
  };
}

export function mapOpenLibraryEntry(isbn13: string, data: {
  title?: string;
  authors?: Array<string | Named>;
  publishers?: Array<string | Named>;
  publish_date?: string | number;
  notes?: unknown;
} | null): LookupBook | null {
  if (!data) return null;
  const publisher = data.publishers?.[0];
  const publisherName = typeof publisher === "string" ? publisher : publisher?.name ?? "";
  return {
    isbn: isbn13,
    title: data.title ?? "",
    authors: parseAuthors(data.authors),
    publisher: publisherName,
    publishDate: data.publish_date ? String(data.publish_date) : "",
    description: typeof data.notes === "string" ? data.notes : "",
    coverUrl: coverUrl(isbn13),
  };
}

function mapGoogleBooksEntry(isbn13: string, info: {
  title?: string;
  authors?: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  imageLinks?: { thumbnail?: string; smallThumbnail?: string };
}): LookupBook {
  const thumb = info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail;
  return {
    isbn: isbn13,
    title: info.title ?? "",
    authors: info.authors ?? [],
    publisher: info.publisher ?? "",
    publishDate: info.publishedDate ?? "",
    description: typeof info.description === "string" ? info.description : "",
    coverUrl: thumb ? thumb.replace(/^http:/, "https:") : coverUrl(isbn13),
  };
}

function mapOpenLibrarySearchEntry(isbn13: string, doc: {
  title?: string;
  author_name?: string[];
  publisher?: string[];
  first_publish_year?: number;
  publish_year?: number[];
  cover_i?: number;
} | undefined): LookupBook | null {
  if (!doc?.title) return null;
  return {
    isbn: isbn13,
    title: doc.title,
    authors: doc.author_name ?? [],
    publisher: doc.publisher?.[0] ?? "",
    publishDate: String(doc.first_publish_year ?? doc.publish_year?.[0] ?? ""),
    description: "",
    coverUrl: doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
      : coverUrl(isbn13),
  };
}

function isValidBook(book: LookupBook | null | undefined): book is LookupBook {
  const title = book?.title?.trim();
  return Boolean(title && !JUNK_TITLE.test(title));
}

function bookScore(book: LookupBook): number {
  if (!isValidBook(book)) return 0;
  let score = 10;
  if (book.authors?.length) score += 5;
  if (book.publisher) score += 2;
  if (book.publishDate) score += 2;
  if (book.description) score += 1;
  if (book.coverUrl && !book.coverUrl.includes("openlibrary.org/b/isbn/")) score += 1;
  return score;
}

function withCoverFallback(book: LookupBook, isbn13: string): LookupBook {
  if (!book.coverUrl || book.coverUrl.includes("openlibrary.org/b/isbn/")) {
    return { ...book, coverUrl: book.coverUrl || coverUrl(isbn13) };
  }
  return book;
}

export function mergeBooks(books: Array<LookupBook | null>, isbn13: string): LookupBook {
  const ranked = books.filter(isValidBook).sort((a, b) => bookScore(b) - bookScore(a));
  if (!ranked.length) return emptyBook(isbn13);

  const best = { ...ranked[0] } as LookupBook;
  for (const other of ranked.slice(1)) {
    if (!best.authors?.length && other.authors?.length) best.authors = other.authors;
    if (!best.publisher && other.publisher) best.publisher = other.publisher;
    if (!best.publishDate && other.publishDate) best.publishDate = other.publishDate;
    if (!best.description && other.description) best.description = other.description;
    if (
      best.coverUrl?.includes("openlibrary.org/b/isbn/") &&
      other.coverUrl &&
      !other.coverUrl.includes("openlibrary.org/b/isbn/")
    ) {
      best.coverUrl = other.coverUrl;
    }
  }
  return withCoverFallback(best, isbn13);
}

async function lookupGoogleBooks(isbn13: string): Promise<LookupBook | null> {
  try {
    const keyParam = GOOGLE_BOOKS_KEY ? `&key=${encodeURIComponent(GOOGLE_BOOKS_KEY)}` : "";
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn13}&maxResults=1${keyParam}`);
    if (!res.ok) return null;
    const json = await res.json() as { items?: Array<{ volumeInfo?: Parameters<typeof mapGoogleBooksEntry>[1] }> };
    const info = json.items?.[0]?.volumeInfo;
    if (!info?.title) return null;
    return mapGoogleBooksEntry(isbn13, info);
  } catch {
    return null;
  }
}

async function lookupOpenLibraryBooks(isbn13: string): Promise<LookupBook | null> {
  try {
    const res = await fetch(`${API_BASE}?bibkeys=ISBN:${isbn13}&format=json&jscmd=data`);
    if (!res.ok) return null;
    const json = await res.json() as Record<string, Parameters<typeof mapOpenLibraryEntry>[1]>;
    return mapOpenLibraryEntry(isbn13, json[`ISBN:${isbn13}`] ?? null);
  } catch {
    return null;
  }
}

async function lookupOpenLibrarySearch(isbn13: string): Promise<LookupBook | null> {
  try {
    const url = new URL("https://openlibrary.org/search.json");
    url.searchParams.set("isbn", isbn13);
    url.searchParams.set("fields", "title,author_name,publisher,publish_year,first_publish_year,cover_i");
    url.searchParams.set("limit", "1");
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json() as { docs?: Array<Parameters<typeof mapOpenLibrarySearchEntry>[1]> };
    return mapOpenLibrarySearchEntry(isbn13, json.docs?.[0]);
  } catch {
    return null;
  }
}

export async function lookupIsbn(rawIsbn: string): Promise<LookupBook> {
  const isbn13 = toIsbn13(rawIsbn);
  if (!isbn13) throw new Error("Invalid ISBN");
  const results = await Promise.all([
    lookupGoogleBooks(isbn13),
    lookupOpenLibraryBooks(isbn13),
    lookupOpenLibrarySearch(isbn13),
  ]);
  return mergeBooks(results, isbn13);
}

export function createManualBook(isbn13: string, title = "", authors: string[] = []): LookupBook {
  return {
    isbn: isbn13,
    title: title.trim(),
    authors: authors.filter(Boolean),
    publisher: "",
    publishDate: "",
    description: "",
    coverUrl: coverUrl(isbn13),
  };
}
