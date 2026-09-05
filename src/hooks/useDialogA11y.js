import { useEffect, useRef } from 'react';

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusable(container) {
  if (!container) return [];
  return [...container.querySelectorAll(FOCUSABLE)].filter(
    (el) => el.offsetParent !== null || el === document.activeElement,
  );
}

/**
 * Dialog a11y: Escape, focus trap, scroll lock, focus restore.
 * @param {{ open: boolean, trapActive?: boolean, onClose: () => void, containerRef: import('react').RefObject<HTMLElement|null>, initialFocusRef?: import('react').RefObject<HTMLElement|null>, returnFocusRef?: import('react').RefObject<HTMLElement|null> }} opts
 */
export function useDialogA11y({
  open,
  trapActive = open,
  onClose,
  containerRef,
  initialFocusRef,
  returnFocusRef,
}) {
  const onCloseRef = useRef(onClose);
  const triggerRef = useRef(null);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    triggerRef.current =
      returnFocusRef?.current ??
      (document.activeElement instanceof HTMLElement ? document.activeElement : null);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevOverflow;

      const restore = triggerRef.current;
      if (restore instanceof HTMLElement && document.contains(restore)) {
        restore.focus();
      }
    };
  }, [open, returnFocusRef]);

  useEffect(() => {
    if (!trapActive) return;

    const focusTarget = initialFocusRef?.current ?? getFocusable(containerRef.current)[0];
    focusTarget?.focus();

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (e.key !== 'Tab') return;

      const container = containerRef.current;
      if (!container) return;

      const items = getFocusable(container);
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [trapActive, containerRef, initialFocusRef]);
}
