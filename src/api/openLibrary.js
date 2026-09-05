import { coverUrl, toIsbn13 } from '../utils/isbn.js';

const API_BASE = 'https://openlibrary.org/api/books';
const GOOGLE_BOOKS_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY ?? '';

function parseAuthors(authors = []) {
  return authors.map((a) => (typeof a === 'string' ? a : a?.name)).filter(Boolean);
}

function parsePublishDate(publishDate) {
  if (!publishDate) return '';
  if (typeof publishDate === 'string') return publishDate;
  return String(publishDate);
}

function emptyBook(isbn13) {
  return {
    isbn: isbn13,
    title: '',
    authors: [],
    publisher: '',
    publishDate: '',
    description: '',
    coverUrl: coverUrl(isbn13),
  };
}

export function mapOpenLibraryEntry(isbn13, data) {
  if (!data) return null;

  const authors = parseAuthors(data.authors);
  const publisher = data.publishers?.[0]?.name ?? data.publishers?.[0] ?? '';

  return {
    isbn: isbn13,
    title: data.title ?? '',
    authors,
    publisher: typeof publisher === 'string' ? publisher : publisher?.name ?? '',
    publishDate: parsePublishDate(data.publish_date),
    description: typeof data.notes === 'string' ? data.notes : '',
    coverUrl: coverUrl(isbn13),
  };
}

function mapGoogleBooksEntry(isbn13, info) {
  const thumb = info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail;
  return {
    isbn: isbn13,
    title: info.title ?? '',
    authors: info.authors ?? [],
    publisher: info.publisher ?? '',
    publishDate: info.publishedDate ?? '',
    description: info.description ?? '',
    coverUrl: thumb ? thumb.replace(/^http:/, 'https:') : coverUrl(isbn13),
  };
}

function mapOpenLibrarySearchEntry(isbn13, doc) {
  if (!doc?.title) return null;

  return {
    isbn: isbn13,
    title: doc.title,
    authors: doc.author_name ?? [],
    publisher: doc.publisher?.[0] ?? '',
    publishDate: String(doc.first_publish_year ?? doc.publish_year?.[0] ?? ''),
    description: '',
    coverUrl: doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
      : coverUrl(isbn13),
  };
}

function bookScore(book) {
  if (!isValidBook(book)) return 0;

  let score = 10;
  if (book.authors?.length) score += 5;
  if (book.publisher) score += 2;
  if (book.publishDate) score += 2;
  if (book.description) score += 1;
  if (book.coverUrl && !book.coverUrl.includes('openlibrary.org/b/isbn/')) score += 1;
  return score;
}

const JUNK_TITLE = /please verify|just a moment|access denied|page not found|isbn search/i;

function isValidBook(book) {
  const title = book?.title?.trim();
  if (!title || JUNK_TITLE.test(title)) return false;
  return Boolean(book.authors?.length || book.publisher);
}

function withCoverFallback(book, isbn13) {
  if (!book.coverUrl || book.coverUrl.includes('openlibrary.org/b/isbn/')) {
    return { ...book, coverUrl: book.coverUrl || coverUrl(isbn13) };
  }
  return book;
}

function mergeBooks(books, isbn13) {
  const ranked = books.filter(isValidBook).sort((a, b) => bookScore(b) - bookScore(a));
  if (!ranked.length) return emptyBook(isbn13);

  const best = { ...ranked[0] };
  for (const other of ranked.slice(1)) {
    if (!best.authors?.length && other.authors?.length) best.authors = other.authors;
    if (!best.publisher && other.publisher) best.publisher = other.publisher;
    if (!best.publishDate && other.publishDate) best.publishDate = other.publishDate;
    if (!best.description && other.description) best.description = other.description;
    if (
      best.coverUrl?.includes('openlibrary.org/b/isbn/') &&
      other.coverUrl &&
      !other.coverUrl.includes('openlibrary.org/b/isbn/')
    ) {
      best.coverUrl = other.coverUrl;
    }
  }

  return withCoverFallback(best, isbn13);
}

async function lookupGoogleBooks(isbn13) {
  try {
    const keyParam = GOOGLE_BOOKS_KEY
      ? `&key=${encodeURIComponent(GOOGLE_BOOKS_KEY)}`
      : '';
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn13}&maxResults=1${keyParam}`,
    );
    if (!res.ok) return null;
    const json = await res.json();
    const info = json.items?.[0]?.volumeInfo;
    if (!info?.title) return null;
    return mapGoogleBooksEntry(isbn13, info);
  } catch {
    return null;
  }
}

async function lookupOpenLibraryBooks(isbn13) {
  const url = `${API_BASE}?bibkeys=ISBN:${isbn13}&format=json&jscmd=data`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const json = await res.json();
  const entry = json[`ISBN:${isbn13}`];
  if (!entry) return null;
  return mapOpenLibraryEntry(isbn13, entry);
}

async function lookupOpenLibrarySearch(isbn13) {
  try {
    const url = new URL('https://openlibrary.org/search.json');
    url.searchParams.set('isbn', isbn13);
    url.searchParams.set(
      'fields',
      'title,author_name,publisher,publish_year,first_publish_year,cover_i',
    );
    url.searchParams.set('limit', '1');

    const res = await fetch(url);
    if (!res.ok) return null;

    const json = await res.json();
    return mapOpenLibrarySearchEntry(isbn13, json.docs?.[0]);
  } catch {
    return null;
  }
}

export async function lookupIsbn(rawIsbn) {
  const isbn13 = toIsbn13(rawIsbn);
  if (!isbn13) {
    throw new Error('Invalid ISBN');
  }

  const results = await Promise.all([
    lookupGoogleBooks(isbn13),
    lookupOpenLibraryBooks(isbn13),
    lookupOpenLibrarySearch(isbn13),
  ]);

  return mergeBooks(results, isbn13);
}

export function createManualBook(isbn13, title = '', authors = []) {
  return {
    isbn: isbn13,
    title: title.trim(),
    authors: Array.isArray(authors) ? authors.filter(Boolean) : [],
    publisher: '',
    publishDate: '',
    description: '',
    coverUrl: coverUrl(isbn13),
  };
}
