import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useMemo, useState } from 'react';
import {
  addBook,
  db,
  exportLibrary,
  getAllBooks,
  importLibrary,
  removeBook,
  searchBooks,
  updateBook,
} from '../db/db.js';

export function useBooks() {
  const books = useLiveQuery(() => getAllBooks(), []);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBooks = useLiveQuery(
    () => (searchQuery ? searchBooks(searchQuery) : getAllBooks()),
    [searchQuery],
  );

  const add = useCallback(async (book) => {
    return addBook(book);
  }, []);

  const update = useCallback(async (id, updates) => {
    return updateBook(id, updates);
  }, []);

  const remove = useCallback(async (id) => {
    return removeBook(id);
  }, []);

  const exportData = useCallback(async () => {
    return exportLibrary();
  }, []);

  const importData = useCallback(async (data, options) => {
    return importLibrary(data, options);
  }, []);

  const count = books?.length ?? 0;

  return useMemo(
    () => ({
      books: filteredBooks ?? [],
      allBooks: books ?? [],
      count,
      searchQuery,
      setSearchQuery,
      add,
      update,
      remove,
      exportData,
      importData,
      isLoading: books === undefined,
    }),
    [filteredBooks, books, count, searchQuery, add, update, remove, exportData, importData],
  );
}

export { db };
