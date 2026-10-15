import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  addBook,
  exportLibrary,
  getAllBooks,
  importLibrary,
  removeBook,
  restoreBook,
  updateBook,
} from "@/db/db";
import { collectTags, filterAndSortBooks } from "@/lib/library";
import type { Book, LibraryFile, NewBook, SortKey, StatusFilter } from "@/types";

export function useLibrary() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["books"],
    queryFn: getAllBooks,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("added");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [tagFilter, setTagFilter] = useState("");

  const allBooks = useMemo(() => query.data ?? [], [query.data]);
  const tags = useMemo(() => collectTags(allBooks), [allBooks]);
  const books = useMemo(
    () => filterAndSortBooks(allBooks, { query: searchQuery, status: statusFilter, tag: tagFilter, sort: sortBy }),
    [allBooks, searchQuery, statusFilter, tagFilter, sortBy],
  );

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["books"] });

  const add = useMutation({
    mutationFn: (book: NewBook) => addBook(book),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Book> }) => updateBook(id, updates),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: number) => removeBook(id),
    onSuccess: invalidate,
  });
  const restore = useMutation({
    mutationFn: (book: Book) => restoreBook(book),
    onSuccess: invalidate,
  });
  const importData = useMutation({
    mutationFn: ({ data, replace }: { data: LibraryFile; replace: boolean }) => importLibrary(data, { replace }),
    onSuccess: invalidate,
  });

  return {
    books,
    allBooks,
    count: allBooks.length,
    tags,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    statusFilter,
    setStatusFilter,
    tagFilter,
    setTagFilter,
    isLoading: query.isLoading,
    add: add.mutateAsync,
    update: (id: number, updates: Partial<Book>) => update.mutateAsync({ id, updates }),
    remove: remove.mutateAsync,
    restore: restore.mutateAsync,
    exportData: exportLibrary,
    importData: (data: LibraryFile, options?: { replace?: boolean }) =>
      importData.mutateAsync({ data, replace: Boolean(options?.replace) }),
  };
}
