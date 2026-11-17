import Modal from './Modal';
import BookmarkIcon from './BookmarkIcon';

// List of the user's saved places or recipes. items: [{ id, title, subtitle }].
export default function SavedListModal({ open, onClose, title, items, emptyText, onOpenItem, onRemove }) {
  return (
    <Modal open={open} onClose={onClose} title={title} width="clamp(320px, 35vw, 520px)">
      {items.length === 0 ? (
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
                onClick={() => onRemove(item.id)}
              >
                <BookmarkIcon filled />
              </button>
            </div>
          </div>
        ))
      )}
    </Modal>
  );
}
