import { useState } from 'react';
import Modal from './Modal';
import { deleteMyAccount } from '../hooks/useAuth';

// Confirmation before permanently deleting the account. This is the one action
// on the site that can't be undone, so it gets an explicit confirm step.
export default function DeleteAccountModal({ open, onClose, isEboard }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    if (busy) return;
    setError('');
    onClose();
  };

  const handleDelete = async () => {
    setBusy(true);
    setError('');
    const errMsg = await deleteMyAccount();
    setBusy(false);
    if (errMsg) {
      setError(errMsg);
      return;
    }
    onClose(); // signed out now; the pages update on their own
  };

  return (
    <Modal open={open} onClose={handleClose} title="Delete account" width="clamp(280px, 26vw, 380px)">
      <p className="e-hint">
        This permanently deletes your account, along with your saved places, saved recipes and
        likes. It can’t be undone.
      </p>
      {isEboard && (
        <p className="e-hint">
          As an e-board member, your Big Back Lookback photos are removed too. Places and recipes you
          posted stay on the site under your name.
        </p>
      )}
      <button type="button" className="e-btn-danger" onClick={handleDelete} disabled={busy}>
        {busy ? 'Deleting…' : 'Delete my account'}
      </button>
      <button type="button" className="e-btn-secondary" onClick={handleClose} disabled={busy}>
        Cancel
      </button>
      <div className="e-error" role="alert">
        {error}
      </div>
    </Modal>
  );
}
