import { useMemo, useRef, useState } from 'react';
import AddBookSheet from './AddBookSheet.jsx';
import AppBrand from './AppBrand.jsx';
import BookCard from './BookCard.jsx';
import BookDetail from './BookDetail.jsx';
import ExportImport from './ExportImport.jsx';
import InstallHint from './InstallHint.jsx';
import LandingPage from './LandingPage.jsx';
import SearchBar from './SearchBar.jsx';

export default function Bookshelf({
  books,
  allBooks,
  count,
  searchQuery,
  setSearchQuery,
  onAdd,
  onUpdate,
  onRemove,
  onExport,
  onImport,
  isLoading,
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const fabRef = useRef(null);
  const landingAddRef = useRef(null);

  const existingIsbns = useMemo(
    () => new Set(allBooks.map((b) => b.isbn)),
    [allBooks],
  );

  if (selectedBook) {
    const current = books.find((b) => b.id === selectedBook.id) ?? selectedBook;
    return (
      <BookDetail
        book={current}
        onClose={() => setSelectedBook(null)}
        onUpdate={onUpdate}
        onRemove={onRemove}
      />
    );
  }

  if (!isLoading && count === 0) {
    return (
      <div className="bookshelf bookshelf--landing">
        <InstallHint />
        <LandingPage
          onAddBook={() => setAddOpen(true)}
          onExport={onExport}
          onImport={onImport}
          addButtonRef={landingAddRef}
        />
        <AddBookSheet
          open={addOpen}
          onClose={() => setAddOpen(false)}
          onSave={onAdd}
          existingIsbns={existingIsbns}
          returnFocusRef={landingAddRef}
        />
      </div>
    );
  }

  return (
    <div className="bookshelf">
      <header className="bookshelf__header">
        <AppBrand className="bookshelf__header-brand" logoSize="md" />
        <div className="bookshelf__actions">
          <ExportImport onExport={onExport} onImport={onImport} />
        </div>
      </header>

      <InstallHint />
      <SearchBar value={searchQuery} onChange={setSearchQuery} />

      <main id="bookshelf-main" className="bookshelf__main">
        <h1 className="sr-only">Your bookshelf</h1>
        {isLoading ? (
          <p className="bookshelf__status" role="status" aria-live="polite">
            Loading your shelf…
          </p>
        ) : books.length === 0 ? (
          <div className="empty-state">
            <h2>No books match your search</h2>
            <p>Try a different title, author, or ISBN.</p>
            {searchQuery.trim() && (
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setSearchQuery('')}
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="bookshelf__grid">
            {books.map((book) => (
              <BookCard key={book.id} book={book} onClick={setSelectedBook} />
            ))}
          </div>
        )}
      </main>

      {count > 0 && (
        <p className="bookshelf__count">
          {books.length === count
            ? `${count} book${count === 1 ? '' : 's'}`
            : `${books.length} of ${count} books`}
        </p>
      )}

      <button
        type="button"
        className="fab"
        ref={fabRef}
        onClick={() => setAddOpen(true)}
        aria-label="Add book"
      >
        +
      </button>

      <AddBookSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={onAdd}
        existingIsbns={existingIsbns}
        returnFocusRef={fabRef}
      />
    </div>
  );
}
