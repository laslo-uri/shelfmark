import { useRef, useState } from 'react';
import { useDialogA11y } from '../hooks/useDialogA11y.js';
import { BookCover, BookMeta } from './BookCard.jsx';

export default function BookDetail({ book, onClose, onUpdate, onRemove }) {
  const [notes, setNotes] = useState(book.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const overlayRef = useRef(null);
  const backBtnRef = useRef(null);

  useDialogA11y({
    open: true,
    onClose,
    containerRef: overlayRef,
    initialFocusRef: backBtnRef,
  });

  async function handleSaveNotes() {
    setSaving(true);
    try {
      await onUpdate(book.id, { notes });
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await onRemove(book.id);
    onClose();
  }

  const authorText = book.authors?.length ? book.authors.join(', ') : null;

  return (
    <div className="detail-overlay" ref={overlayRef} role="dialog" aria-modal="true" aria-label="Book details">
      <div className="detail">
        <header className="detail__header">
          <button type="button" className="btn btn--ghost" ref={backBtnRef} onClick={onClose}>
            ← Back
          </button>
        </header>

        <div className="detail__hero">
          <BookCover book={book} size="xl" />
          <div className="detail__title-block">
            <h1>{book.title || 'Untitled'}</h1>
            {authorText && <p className="detail__author">{authorText}</p>}
          </div>
        </div>

        <BookMeta book={book} />

        {book.description && (
          <section className="detail__section">
            <h2>Description</h2>
            <p>{book.description}</p>
          </section>
        )}

        <section className="detail__section">
          <h2>Your notes</h2>
          <textarea
            className="textarea"
            rows={4}
            placeholder="Shelf location, read status, lending notes…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            aria-label="Your notes"
          />
          <button
            type="button"
            className="btn btn--secondary"
            onClick={handleSaveNotes}
            disabled={saving || notes === (book.notes ?? '')}
          >
            {saving ? 'Saving…' : 'Save notes'}
          </button>
        </section>

        <section className="detail__section detail__danger">
          <button
            type="button"
            className={`btn ${confirmDelete ? 'btn--danger' : 'btn--ghost'}`}
            onClick={handleRemove}
          >
            {confirmDelete ? 'Confirm remove from shelf' : 'Remove from shelf'}
          </button>
          {confirmDelete && (
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setConfirmDelete(false)}
            >
              Cancel
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
