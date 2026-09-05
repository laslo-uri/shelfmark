import { useRef, useState } from 'react';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner.js';
import { useDialogA11y } from '../hooks/useDialogA11y.js';

export default function BarcodeScanner({ open, onClose, onDetected, returnFocusRef }) {
  const [manualIsbn, setManualIsbn] = useState('');
  const scannerRef = useRef(null);
  const cancelBtnRef = useRef(null);
  const { videoRef, error, mode, ready, capturing, captureAndScan } = useBarcodeScanner({
    active: open,
    onDetected,
  });

  useDialogA11y({
    open,
    onClose,
    containerRef: scannerRef,
    initialFocusRef: cancelBtnRef,
    returnFocusRef,
  });

  function handleManualSubmit(e) {
    e.preventDefault();
    const value = manualIsbn.trim();
    if (value.length >= 10) {
      onDetected?.(value);
    }
  }

  if (!open) return null;

  return (
    <div className="scanner-overlay" ref={scannerRef} role="dialog" aria-modal="true" aria-label="Scan barcode">
      <div className="scanner">
        <header className="scanner__header">
          <h2>Scan ISBN barcode</h2>
          <button type="button" className="btn btn--ghost" ref={cancelBtnRef} onClick={onClose}>
            Cancel
          </button>
        </header>

        <div className="scanner__viewport">
          <video
            ref={videoRef}
            className="scanner__video"
            playsInline
            muted
            autoPlay
            disablePictureInPicture
          />
          <div className="scanner__frame" aria-hidden="true" />
          {!ready && !error && (
            <p className="scanner__status" role="status" aria-live="polite">
              Starting camera…
            </p>
          )}
        </div>

        <div className="scanner__controls">
          <p className="scanner__hint">
            {ready
              ? 'Auto-scanning when a barcode is visible — or tap Capture to scan the current frame.'
              : 'Allow camera access when prompted.'}
            {mode === 'native' && ready ? ' (fast scan)' : null}
          </p>

          <button
            type="button"
            className="btn btn--primary btn--block"
            disabled={!ready || capturing}
            onClick={captureAndScan}
          >
            {capturing ? 'Scanning frame…' : 'Capture & scan'}
          </button>

          <form className="scanner__manual" onSubmit={handleManualSubmit}>
            <label className="scanner__manual-label" htmlFor="scanner-isbn">
              Or type / paste ISBN
            </label>
            <div className="scanner__manual-row">
              <input
                id="scanner-isbn"
                type="text"
                inputMode="numeric"
                className="input"
                placeholder="9788673105130"
                value={manualIsbn}
                onChange={(e) => setManualIsbn(e.target.value)}
              />
              <button
                type="submit"
                className="btn btn--secondary"
                disabled={manualIsbn.replace(/[-\s]/g, '').length < 10}
              >
                Use ISBN
              </button>
            </div>
          </form>
        </div>

        {error && (
          <p className="scanner__error" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
