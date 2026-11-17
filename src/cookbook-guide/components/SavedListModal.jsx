import { useEffect, useState } from 'react';
import Modal from './Modal';
import BookmarkIcon from './BookmarkIcon';

const UNDO_MS = 5000;

// List of the user's saved places or recipes. items: [{ id, title, subtitle }].
// onRemove toggles the save, so calling it again on a removed item restores it.
export default function SavedListModal({ open, onClose, title, items, emptyText, onOpenItem, onRemove }) {
  // The last item removed, offered back for a few seconds instead of asking
  // "are you sure?" up front.
  const [removed, setRemoved] = useState(null);

  useEffect(() => {
    if (!removed) return;
    const timer = setTimeout(() => setRemoved(null), UNDO_MS);
    return () => clearTimeout(timer);
  }, [removed]);

  useEffect(() => {
    if (!open) setRemoved(null);
  }, [open]);

  const remove = (item) => {
    onRemove(item.id);
    setRemoved(item);
  };

  const undo = () => {
    onRemove(removed.id);
    setRemoved(null);
  };

  return (
    <Modal open={open} onClose={onClose} title={title} width="clamp(320px, 35vw, 520px)">
      {items.length === 0 && !removed ? (
        <div className="saved-empty">{emptyText}</div>
      ) : (
        items.map((item) => (
          <div className="my-rec-row" key={item.id}>
            <button
              type="button"
              className="my-rec-info saved-open"
              onClick={() => {
                onClose();
                onOpenItem(item.id);
              }}
            >
              <div className="my-rec-name">{item.title}</div>
              {item.subtitle && <div className="my-rec-meta">{item.subtitle}</div>}
            </button>
            <div className="my-rec-actions">
              <button
                type="button"
                className="btn-rec-edit"
                title="Remove from saved"
                aria-label={`Remove ${item.title} from saved`}
                onClick={() => remove(item)}
              >
                <BookmarkIcon filled />
              </button>
            </div>
          </div>
        ))
      )}

      {removed && (
        <div className="saved-undo" role="status">
          <span>Removed “{removed.title}”</span>
          <button type="button" onClick={undo}>
            Undo
          </button>
        </div>
      )}
    </Modal>
  );
}
