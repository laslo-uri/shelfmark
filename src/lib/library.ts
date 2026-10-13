import type { BookStatus } from "@/types";

export const STATUSES: Array<{ id: BookStatus; label: string }> = [
  { id: "unread", label: "Unread" },
  { id: "reading", label: "Reading" },
  { id: "read", label: "Read" },
];

export interface FilterableBook {
  title?: string;
  authors?: string[];
  isbn?: string;
  publisher?: string;
  notes?: string;
  tags?: string[];
  status?: string;
  rating?: number;
  addedAt?: number;
}

export function bookStatus(book: { status?: string } | null | undefined) {
  return book?.status || "unread";
}

export function collectTags(books: Array<{ tags?: string[] }>) {
  const tags = new Set<string>();
  for (const book of books) {
    for (const tag of book.tags || []) {
      if (tag) tags.add(tag);
    }
  }
  return [...tags].sort((a, b) => a.localeCompare(b));
}

export function filterAndSortBooks<T extends FilterableBook>(
  books: readonly T[],
  { query = "", status = "all", tag = "", sort = "added" } = {},
) {
  const q = query.trim().toLowerCase();
  let list = books.filter((book) => {
    if (status !== "all" && bookStatus(book) !== status) return false;
    if (tag && !(book.tags || []).includes(tag)) return false;
    if (!q) return true;
    const haystack = [
      book.title,
      book.isbn,
      ...(book.authors ?? []),
      book.publisher,
      book.notes,
      ...(book.tags ?? []),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });

  list = [...list];
  if (sort === "title") {
    list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
  } else if (sort === "author") {
    list.sort((a, b) => (a.authors?.[0] || "").localeCompare(b.authors?.[0] || ""));
  } else if (sort === "rating") {
    list.sort(
      (a, b) => (b.rating || 0) - (a.rating || 0) || (a.title || "").localeCompare(b.title || ""),
    );
  } else {
    list.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
  }
  return list;
}
