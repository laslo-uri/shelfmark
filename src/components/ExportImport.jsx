import { useEffect, useId, useRef, useState } from 'react';
import { downloadJson } from '../utils/download.js';

export default function ExportImport({ onExport, onImport }) {
  const fileRef = useRef(null);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const firstMenuItemRef = useRef(null);
  const menuId = useId();
  const [status, setStatus] = useState(null);
  const [open, setOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState(null);

  function closeMenu() {
    setOpen(false);
    setPendingImport(null);
  }

  useEffect(() => {
    if (!open) return;

    firstMenuItemRef.current?.focus();

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMenu();
        triggerRef.current?.focus();
      }
    }

    function handlePointerDown(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        closeMenu();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [open]);

  async function handleExport() {
    try {
      const data = await onExport();
      const filename = `shelfmark-library-${new Date().toISOString().slice(0, 10)}.json`;
      await downloadJson(filename, data);
      setStatus({ type: 'success', text: 'Library exported.' });
    } catch (err) {
      if (err?.name === 'AbortError') return;
      setStatus({ type: 'error', text: 'Export failed.' });
    } finally {
      closeMenu();
    }
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      setPendingImport(data);
      setOpen(true);
    } catch {
      setStatus({ type: 'error', text: 'Invalid library file.' });
      closeMenu();
    } finally {
      e.target.value = '';
    }
  }

  async function handleImportChoice(replace) {
    if (!pendingImport) return;

    try {
      await onImport(pendingImport, { replace });
      setStatus({
        type: 'success',
        text: replace ? 'Library replaced.' : 'Library merged.',
      });
    } catch {
      setStatus({ type: 'error', text: 'Import failed.' });
    } finally {
      closeMenu();
    }
  }

  return (
    <div className="export-import" ref={rootRef}>
      <button
        type="button"
        className="btn btn--ghost btn--sm"
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
      >
        Backup
      </button>

      {open && (
        <div className="export-import__menu" id={menuId} role="menu">
          {pendingImport ? (
            <>
              <p className="export-import__prompt" role="status" aria-live="polite">
                How should imported books be added?
              </p>
              <button
                type="button"
                className="export-import__item"
                ref={firstMenuItemRef}
                onClick={() => handleImportChoice(false)}
              >
                Merge (skip duplicates)
              </button>
              <button
                type="button"
                className="export-import__item export-import__item--danger"
                onClick={() => handleImportChoice(true)}
              >
                Replace entire library
              </button>
              <button
                type="button"
                className="export-import__item"
                onClick={() => {
                  setPendingImport(null);
                  closeMenu();
                  triggerRef.current?.focus();
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="export-import__item"
                ref={firstMenuItemRef}
                onClick={handleExport}
              >
                Export JSON
              </button>
              <button
                type="button"
                className="export-import__item"
                onClick={() => fileRef.current?.click()}
              >
                Import JSON
              </button>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={handleFileChange}
          />
        </div>
      )}

      {status && (
        <span
          className={`export-import__status export-import__status--${status.type}`}
          role="status"
          aria-live="polite"
        >
          {status.text}
        </span>
      )}
    </div>
  );
}
