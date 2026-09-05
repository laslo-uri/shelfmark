import { useEffect, useRef, useState } from 'react';
import { createManualBook, lookupIsbn } from '../api/openLibrary.js';
import { useDialogA11y } from '../hooks/useDialogA11y.js';
import { toIsbn13 } from '../utils/isbn.js';
import { BookCover, BookMeta } from './BookCard.jsx';
import BarcodeScanner from './BarcodeScanner.jsx';

export default function AddBookSheet({ open, onClose, onSave, existingIsbns, returnFocusRef }) {
  const [isbnInput, setIsbnInput] = useState('');
  const [preview, setPreview] = useState(null);
  const [manualTitle, setManualTitle] = useState('');
  const [manualAuthors, setManualAuthors] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [duplicate, setDuplicate] = useState(false);
  const previewRef = useRef(null);
  const sheetRef = useRef(null);
  const closeBtnRef = useRef(null);
  const scanBtnRef = useRef(null);
  const scannerOpenRef = useRef(false);

  scannerOpenRef.current = scannerOpen;

  useDialogA11y({
    open,
    trapActive: open && !scannerOpen,
    onClose: () => {
      if (!scannerOpenRef.current) onClose();
    },
    containerRef: sheetRef,
    initialFocusRef: closeBtnRef,
    returnFocusRef,
  });

  useEffect(() => {
    if (!open) {
      setIsbnInput('');
      setPreview(null);
      setManualTitle('');
      setManualAuthors('');
      setLoading(false);
      setError(null);
      setInfo(null);
      setScannerOpen(false);
      setDuplicate(false);
    }
  }, [open]);

  useEffect(() => {
    if (preview && previewRef.current) {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      previewRef.current.scrollIntoView({
        behavior: reducedMotion ? 'auto' : 'smooth',
        block: 'nearest',
      });
    }
  }, [preview]);

  async function lookup(raw) {
    setLoading(true);
    setError(null);
    setInfo(null);
    setDuplicate(false);

    const isbn13 = toIsbn13(raw);
    if (!isbn13) {
      setError('Invalid ISBN — check the number and try again.');
      setPreview(null);
      setLoading(false);
      return;
    }

    setIsbnInput(isbn13);

    if (existingIsbns.has(isbn13)) {
      setDuplicate(true);
      setPreview(null);
      setLoading(false);
      return;
    }

    try {
      const book = await lookupIsbn(isbn13);
      setPreview(book);
      setManualTitle(book.title);
      setManualAuthors(book.authors?.join(', ') ?? '');
      if (!book.title?.trim()) {
        setInfo(
          'No title found online for this ISBN (common for regional books). Add a Google Books API key in Vercel for better coverage, or enter the title below.',
        );
      }
    } catch {
      const book = createManualBook(isbn13);
      setPreview(book);
      setManualTitle('');
      setManualAuthors('');
      setInfo('Could not reach book databases. Enter the title manually, then tap Add to shelf.');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmitIsbn(e) {
    e.preventDefault();
    lookup(isbnInput);
  }

  function openManualEntry() {
    const isbn13 = toIsbn13(isbnInput);
    if (!isbn13) {
      setError('Enter a valid ISBN first, or scan a barcode.');
      return;
    }
    if (existingIsbns.has(isbn13)) {
      setDuplicate(true);
      return;
    }
    setPreview(createManualBook(isbn13));
    setManualTitle('');
    setManualAuthors('');
    setInfo('Enter book details below, then tap Add to shelf.');
    setError(null);
  }

  function handleScanDetected(raw) {
    setScannerOpen(false);
    lookup(raw);
  }

  async function handleSave() {
    if (!preview) return;

    const title = (manualTitle || preview.title || '').trim();
    if (!title) {
      setError('Please enter a title for this book.');
      return;
    }

    const authors = manualAuthors
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    try {
      await onSave({ ...preview, title, authors });
      onClose();
    } catch (err) {
      if (err.code === 'DUPLICATE') {
        setDuplicate(true);
      } else {
        setError(err.message || 'Could not save book.');
      }
    }
  }

  const needsManualDetails = preview && !preview.title?.trim();

  if (!open) return null;

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="sheet" ref={sheetRef} role="dialog" aria-modal="true" aria-label="Add book">
        <div className="sheet__handle" aria-hidden="true" />
        <header className="sheet__header">
          <h2>Add to shelf</h2>
          <button type="button" className="btn btn--ghost" ref={closeBtnRef} onClick={onClose}>
            Close
          </button>
        </header>

        <div className="sheet__body">
          <button
            type="button"
            className="btn btn--primary btn--block scan-btn"
            ref={scanBtnRef}
            onClick={() => setScannerOpen(true)}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="3" y="5" width="4" height="14" rx="1" fill="currentColor" />
              <rect x="9" y="5" width="2" height="14" rx="0.5" fill="currentColor" />
              <rect x="13" y="5" width="1" height="14" fill="currentColor" />
              <rect x="16" y="5" width="3" height="14" rx="0.5" fill="currentColor" />
              <rect x="21" y="5" width="1" height="14" fill="currentColor" />
            </svg>
            Scan barcode
          </button>

          <div className="divider">
            <span>or enter ISBN</span>
          </div>

          <form onSubmit={handleSubmitIsbn} className="isbn-form">
            <input
              type="text"
              inputMode="numeric"
              className="input"
              placeholder="978-0-14-312774-1"
              value={isbnInput}
              onChange={(e) => setIsbnInput(e.target.value)}
              aria-label="ISBN"
            />
            <button
              type="submit"
              className="btn btn--secondary"
              disabled={loading || !isbnInput.trim()}
            >
              {loading ? 'Looking up…' : 'Look up'}
            </button>
          </form>

          <p className="sheet__help">
            After entering an ISBN, click <strong>Look up</strong>. If nothing is found online, you
            can still add the book with a title you type.
          </p>

          {!preview && !loading && isbnInput.trim() && (
            <button type="button" className="btn btn--ghost btn--sm sheet__manual-link" onClick={openManualEntry}>
              Skip lookup — enter details manually
            </button>
          )}

          {duplicate && (
            <p className="message message--warning" role="status" aria-live="polite">
              This book is already on your shelf.
            </p>
          )}
          {info && !duplicate && (
            <p className="message message--info" role="status" aria-live="polite">
              {info}
            </p>
          )}
          {error && !duplicate && (
            <p className="message message--error" role="alert">
              {error}
            </p>
          )}

          {preview && !duplicate && (
            <div className="preview" ref={previewRef}>
              <BookCover book={preview} size="lg" />
              <div className="preview__details">
                <label className="field">
                  <span>Title {needsManualDetails ? '(required)' : ''}</span>
                  <input
                    type="text"
                    className="input"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    placeholder="e.g. C++ jedna lekcija dnevno"
                    autoFocus={needsManualDetails}
                  />
                </label>
                <label className="field">
                  <span>Author(s)</span>
                  <input
                    type="text"
                    className="input"
                    value={manualAuthors}
                    onChange={(e) => setManualAuthors(e.target.value)}
                    placeholder="Siddhartha Rao"
                  />
                </label>
                {!needsManualDetails && preview.title && (
                  <BookMeta book={{ ...preview, title: manualTitle || preview.title, authors: manualAuthors.split(',').map((a) => a.trim()).filter(Boolean) }} />
                )}
                {needsManualDetails && (
                  <p className="book-meta book-meta--isbn">
                    ISBN {preview.isbn}
                  </p>
                )}
                <button type="button" className="btn btn--primary btn--block" onClick={handleSave}>
                  Add to shelf
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={handleScanDetected}
        returnFocusRef={scanBtnRef}
      />
    </>
  );
}
