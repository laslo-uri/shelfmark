import type { Book, BookStatus } from "@/types";
import { toIsbn13 } from "@/lib/isbn";

/** Hard caps so a hand-edited or hostile backup cannot bloat IndexedDB or the UI. */
export const MAX_IMPORT_BYTES = 50 * 1024 * 1024;
const MAX_TEXT = 20_000;
const MAX_SHORT_TEXT = 1_000;
const MAX_LIST = 100;
const MAX_COVER_URL = 2 * 1024 * 1024;

const STATUS_IDS = new Set<BookStatus>(["unread", "reading", "read"]);

/**
 * Only allow image sources that cannot run script or reach odd schemes:
 * http(s), inline images, and local blob URLs.
 */
export function safeCoverUrl(value: unknown): string {
  if (typeof value !== "string") return "";
  const url = value.trim();
  if (!url || url.length > MAX_COVER_URL) return "";
  if (/^data:image\/(png|jpe?g|gif|webp|avif|svg\+xml);/i.test(url)) return url;
  if (/^blob:/i.test(url)) return url;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? url : "";
  } catch {
    return "";
  }
}

function text(value: unknown, max: number): string {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return typeof value === "string" ? value.slice(0, max) : "";
}

function textList(value: unknown): string[] {
  const list = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
  const out: string[] = [];
  for (const item of list) {
    const entry = text(item, MAX_SHORT_TEXT).trim();
    if (entry && !out.includes(entry)) out.push(entry);
    if (out.length >= MAX_LIST) break;
  }
  return out;
}

export function normalizeStatus(value: unknown): BookStatus {
  return STATUS_IDS.has(value as BookStatus) ? (value as BookStatus) : "unread";
}

export function normalizeRating(value: unknown): number {
  const rating = Math.round(Number(value));
  return Number.isFinite(rating) ? Math.min(5, Math.max(0, rating)) : 0;
}

function normalizeTimestamp(value: unknown, fallback: number): number {
  const time = typeof value === "string" ? Date.parse(value) : Number(value);
  return Number.isFinite(time) && time > 0 ? time : fallback;
}

/** Normalizes an ISBN to ISBN-13 when valid; otherwise keeps a trimmed, compact identifier. */
export function normalizeIsbn(value: unknown): string {
  const raw = text(value, 64).trim();
  if (!raw) return "";
  return toIsbn13(raw) ?? raw.replace(/[-\s]/g, "");
}

/**
 * Turns an untrusted record (backup file, older schema) into a complete Book
 * without an id. Returns null when the record has no usable ISBN.
 */
export function sanitizeBook(raw: unknown, now = Date.now()): Omit<Book, "id"> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const book = raw as Record<string, unknown>;
  const isbn = normalizeIsbn(book.isbn);
  if (!isbn) return null;
  return {
    isbn,
    title: text(book.title, MAX_SHORT_TEXT).trim(),
    authors: textList(book.authors),
    publisher: text(book.publisher, MAX_SHORT_TEXT),
    publishDate: text(book.publishDate, 64),
    description: text(book.description, MAX_TEXT),
    coverUrl: safeCoverUrl(book.coverUrl),
    notes: text(book.notes, MAX_TEXT),
    status: normalizeStatus(book.status),
    rating: normalizeRating(book.rating),
    tags: textList(book.tags),
    addedAt: normalizeTimestamp(book.addedAt, now),
  };
}

/** Parses a backup file's text, throwing a readable error if it is not a Shelfmark library. */
export function parseLibraryText(textValue: string): { books: unknown[] } {
  if (textValue.length > MAX_IMPORT_BYTES) throw new Error("That file is too large to import.");
  let data: unknown;
  try {
    data = JSON.parse(textValue);
  } catch {
    throw new Error("Invalid library file.");
  }
  const books = Array.isArray(data)
    ? data
    : data && typeof data === "object" && Array.isArray((data as { books?: unknown }).books)
      ? (data as { books: unknown[] }).books
      : null;
  if (!books) throw new Error("Invalid library file.");
  return { books };
}
