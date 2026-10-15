export type BookStatus = "unread" | "reading" | "read";

export type SortKey = "added" | "title" | "author" | "rating";

export type StatusFilter = "all" | BookStatus;

export interface Book {
  id?: number;
  isbn: string;
  title: string;
  authors: string[];
  publisher: string;
  publishDate: string;
  description: string;
  coverUrl: string;
  notes: string;
  status: BookStatus;
  rating: number;
  tags: string[];
  addedAt: number;
}

export type LookupBook = Pick<
  Book,
  "isbn" | "title" | "authors" | "publisher" | "publishDate" | "description" | "coverUrl"
>;

export type NewBook = Partial<Omit<Book, "isbn">> & { isbn: string };

export interface LibraryFile {
  version?: number;
  exportedAt?: string;
  /** Untrusted records; sanitized by the importer. */
  books?: unknown[];
}

export interface LibraryExport {
  version: 1;
  exportedAt: string;
  books: Book[];
}
