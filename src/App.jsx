import Bookshelf from './components/Bookshelf.jsx';
import { useBooks } from './hooks/useBooks.js';

export default function App() {
  const {
    books,
    allBooks,
    count,
    searchQuery,
    setSearchQuery,
    add,
    update,
    remove,
    exportData,
    importData,
    isLoading,
  } = useBooks();

  return (
    <Bookshelf
      books={books}
      allBooks={allBooks}
      count={count}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      onAdd={add}
      onUpdate={update}
      onRemove={remove}
      onExport={exportData}
      onImport={importData}
      isLoading={isLoading}
    />
  );
}
