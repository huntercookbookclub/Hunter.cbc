import { useEffect, useId, useRef, useState } from 'react';

const EXIT_MS = 160; // matches the e-modal-out / e-backdrop-out animations

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

// Shared pop-up box. Grows in on open and shrinks back out the same way on
// close; Escape closes it; it's announced as a dialog, focus moves into it,
// Tab stays inside it, and focus returns to where it was when it closes.
export default function Modal({ open, onClose, title, width, children }) {
  // Stay mounted for a moment after closing so the exit animation can play.
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);
  const boxRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
      return;
    }
    if (!mounted) return;
    setClosing(true);
    const timer = setTimeout(() => {
      setMounted(false);
      setClosing(false);
    }, EXIT_MS);
    return () => clearTimeout(timer);
  }, [open, mounted]);

  // Move focus in on open (first field, else the box), and back out on close.
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    const box = boxRef.current;
    const first = box?.querySelector('.e-body input, .e-body textarea, .e-body select') || box;
    first?.focus({ preventScroll: true });
    return () => previous?.focus?.({ preventScroll: true });
  }, [open]);

  // Render on the same pass `open` turns true, so focus can move in right away.
  if (!open && !mounted) return null;

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation(); // don't also close the panel behind the box
      onClose();
      return;
    }
    if (e.key !== 'Tab') return;
    // Keep Tab inside the box.
    const items = [...boxRef.current.querySelectorAll(FOCUSABLE)];
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
  };

  return (
    <>
      <div className={`e-backdrop visible${closing ? ' closing' : ''}`} onClick={onClose} />
      <div
        ref={boxRef}
        className={`e-modal visible${closing ? ' closing' : ''}`}
        style={width ? { width } : undefined}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <div className="e-header">
          <span className="e-title" id={titleId}>
            {title}
          </span>
          <button className="e-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="e-body">{children}</div>
      </div>
    </>
  );
}
