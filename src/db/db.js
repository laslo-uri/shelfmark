import Dexie from 'dexie';

export const db = new Dexie('shelfmark');

db.version(1).stores({
  books: '++id, isbn, title, addedAt',
});

export async function getAllBooks() {
  return db.books.orderBy('addedAt').reverse().toArray();
}

export async function getBookByIsbn(isbn) {
  return db.books.where('isbn').equals(isbn).first();
}

export async function getBook(id) {
  return db.books.get(id);
}

export async function addBook(book) {
  const existing = await getBookByIsbn(book.isbn);
  if (existing) {
    const err = new Error('Already on your shelf');
    err.code = 'DUPLICATE';
    err.existing = existing;
    throw err;
  }

  const id = await db.books.add({
    ...book,
    addedAt: Date.now(),
    notes: book.notes ?? '',
  });
  return id;
}

export async function updateBook(id, updates) {
  return db.books.update(id, updates);
}

export async function removeBook(id) {
  return db.books.delete(id);
}

export async function searchBooks(query) {
  const q = query.trim().toLowerCase();
  if (!q) return getAllBooks();

  const books = await getAllBooks();
  return books.filter((book) => {
    const haystack = [
      book.title,
      book.isbn,
      ...(book.authors ?? []),
      book.publisher,
      book.notes,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

export async function exportLibrary() {
  const books = await getAllBooks();
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    books,
  };
}

export async function importLibrary(data, { replace = false } = {}) {
  if (!data?.books || !Array.isArray(data.books)) {
    throw new Error('Invalid library file');
  }

  await db.transaction('rw', db.books, async () => {
    if (replace) {
      await db.books.clear();
    }

    for (const book of data.books) {
      if (!book.isbn) continue;
      const existing = await db.books.where('isbn').equals(book.isbn).first();
      if (existing && !replace) continue;

      const { id: _id, ...rest } = book;
      if (existing) {
        await db.books.update(existing.id, rest);
      } else {
        await db.books.add(rest);
      }
    }
  });
}
