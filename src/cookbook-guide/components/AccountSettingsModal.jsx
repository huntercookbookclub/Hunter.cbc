import { useEffect, useState } from 'react';
import Modal from './Modal';
import { sbClient } from '../lib/supabaseClient';
import { deleteMyAccount, isDisplayNameAvailable, isEboardUser, NAME_TAKEN_MESSAGE } from '../hooks/useAuth';
import { useShowActivity } from '../hooks/useProfile';
import { setThemeChoice, useThemeChoice } from '../../theme';

export default function AccountSettingsModal({ open, onClose, currentUser, onSaved }) {
  const theme = useThemeChoice();
  const [firstName, setFirstName] = useState('');
  const [lastInitial, setLastInitial] = useState('');
  const [role, setRole] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [removeFlag, setRemoveFlag] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  // Everyone has a picture and a display name; e-board also keep first name,
  // last initial and role (used on their place recommendations).
  const isEboard = isEboardUser(currentUser);
  const [displayName, setDisplayName] = useState('');
  const { showActivity, setShowActivity } = useShowActivity(currentUser);
  const [share, setShare] = useState(false);
  // Delete account: hidden until asked for, then needs the current password.
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (open) {
      const meta = currentUser?.user_metadata || {};
      setFirstName(meta.first_name || '');
      setLastInitial(meta.last_initial || '');
      setRole(meta.role || '');
      setDisplayName(meta.display_name || '');
      setAvatarUrl(meta.avatar_url || null);
      setPendingFile(null);
      setRemoveFlag(false);
      setError('');
    }
  }, [open, currentUser]);

  useEffect(() => {
    if (open) setShare(showActivity);
  }, [open, showActivity]);

  useEffect(() => {
    if (!open) {
      setDeleteOpen(false);
      setDeletePassword('');
      setDeleteError('');
    }
  }, [open]);

  const handleDelete = async (e) => {
    e.preventDefault();
    setDeleting(true);
    setDeleteError('');
    const errMsg = await deleteMyAccount(deletePassword);
    setDeleting(false);
    if (errMsg) {
      setDeleteError(errMsg);
      return;
    }
    onClose(); // signed out now; the pages update on their own
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPendingFile(file);
    setRemoveFlag(false);
    setAvatarUrl(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleRemove = () => {
    setPendingFile(null);
    setRemoveFlag(true);
    setAvatarUrl(null);
  };

  const handleSave = async () => {
    setError('');
    const name = displayName.trim();
    if (!isEboard && (!name || name.length > 40)) {
      setError('Add a display name (up to 40 characters).');
      return;
    }
    let finalAvatarUrl = currentUser?.user_metadata?.avatar_url || null;

    setSaving(true);

    // Public name, worked out the same way as sync_profile in profiles-activity.sql.
    const meta = currentUser?.user_metadata || {};
    const publicName = isEboard
      ? meta.display_name?.trim() || `${firstName.trim()} ${lastInitial.trim()}`.trim()
      : name;
    if (publicName && !(await isDisplayNameAvailable(publicName))) {
      setSaving(false);
      setError(NAME_TAKEN_MESSAGE);
      return;
    }

    if (pendingFile) {
      const ext = pendingFile.name.split('.').pop();
      // uploadPhotos writes to `${folderId}/<random>.<ext>`; passing a fixed
      // name keeps this an upsert-style overwrite like the original file did.
      const path = `${currentUser.id}/avatar.${ext}`;
      const { error: uploadErr } = await sbClient.storage
        .from('avatars')
        .upload(path, pendingFile, { upsert: true });
      if (uploadErr) {
        setError(uploadErr.message);
        setSaving(false);
        return;
      }
      const { data } = sbClient.storage.from('avatars').getPublicUrl(path);
      finalAvatarUrl = data.publicUrl + '?width=200&height=200&quality=80&t=' + Date.now();
    } else if (removeFlag) {
      finalAvatarUrl = null;
    }

    const { error: updateErr } = await sbClient.auth.updateUser({
      data: isEboard
        ? {
            first_name: firstName.trim(),
            last_initial: lastInitial.trim(),
            role: role.trim(),
            avatar_url: finalAvatarUrl,
          }
        : { display_name: name, avatar_url: finalAvatarUrl },
    });

    if (!updateErr && share !== showActivity) {
      const shareErr = await setShowActivity(share);
      if (shareErr) {
        setSaving(false);
        setError(shareErr);
        return;
      }
    }

    setSaving(false);

    if (updateErr) {
      setError(updateErr.message);
      return;
    }

    await onSaved?.();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Account Settings" width="clamp(260px, 22vw, 360px)">
      <div className="e-section-label">Profile picture</div>
      <div className="pfp-upload-wrap">
        <div className="pfp-preview">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
            />
          ) : (
            <span>{((isEboard ? firstName : displayName) || '?')[0].toUpperCase()}</span>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            style={{ display: 'none' }}
            id="pfpFileInput"
            onChange={handleFileChange}
          />
          <button
            type="button"
            className="e-btn-secondary"
            style={{ fontSize: '0.82rem', padding: '8px 16px' }}
            onClick={() => document.getElementById('pfpFileInput').click()}
          >
            Upload photo
          </button>
          {avatarUrl && (
            <button
              type="button"
              className="e-btn-secondary"
              style={{ fontSize: '0.82rem', padding: '8px 16px', color: 'var(--coral)' }}
              onClick={handleRemove}
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <div className="e-section-label">Display name</div>
      {isEboard ? (
        <>
          <input
            type="text"
            className="e-input"
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <input
            type="text"
            className="e-input"
            placeholder="Last initial"
            maxLength={1}
            value={lastInitial}
            onChange={(e) => setLastInitial(e.target.value)}
          />

          <div className="e-section-label">Role</div>
          <input
            type="text"
            className="e-input"
            placeholder="e.g. President, Treasurer..."
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
        </>
      ) : (
        <input
          type="text"
          className="e-input"
          placeholder="e.g. Maya C."
          autoComplete="nickname"
          maxLength={40}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      )}

      <div className="e-section-label">Privacy</div>
      <label className="e-check">
        <input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} />
        <span>
          <strong>Show my name and photo on places and recipes I like or save.</strong> Keep unticked to keep
          likes and saves private.
        </span>
      </label>

      {/* Applies right away and is saved on this device, no Save needed. */}
      <div className="e-section-label" id="appearance-label">Appearance</div>
      <div className="e-segment" role="radiogroup" aria-labelledby="appearance-label">
        {[
          ['auto', 'Auto'],
          ['light', 'Light'],
          ['dark', 'Dark'],
        ].map(([value, label]) => (
          <label key={value}>
            <input
              type="radio"
              name="theme"
              value={value}
              checked={theme === value}
              onChange={() => setThemeChoice(value)}
            />
            {label}
          </label>
        ))}
      </div>
      {theme === 'auto' && <p className="e-hint">Follows your device’s light or dark setting.</p>}

      <div className="e-section-label">Delete account</div>
      {deleteOpen ? (
        <form className="e-form delete-account" onSubmit={handleDelete}>
          <p className="e-hint">
            This permanently deletes your account, saved places, saved recipes and likes. It can’t be
            undone.
            {isEboard &&
              ' Your Big Back Lookback photos are removed too; places and recipes you posted stay on the site under your name.'}
          </p>
          <input
            type="password"
            className="e-input"
            placeholder="Your password, to confirm"
            autoComplete="current-password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            aria-invalid={!!deleteError}
          />
          <button type="submit" className="e-btn-danger" disabled={deleting || !deletePassword}>
            {deleting ? 'Deleting…' : 'Delete my account'}
          </button>
          <button
            type="button"
            className="e-link"
            onClick={() => {
              setDeleteOpen(false);
              setDeletePassword('');
              setDeleteError('');
            }}
            disabled={deleting}
          >
            Cancel
          </button>
          <div className="e-error" role="alert">
            {deleteError}
          </div>
        </form>
      ) : (
        <button type="button" className="e-link danger-link" onClick={() => setDeleteOpen(true)}>
          Delete my account…
        </button>
      )}

      <div className="e-error">{error}</div>
      <button className="e-btn-primary" onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save'}
      </button>
    </Modal>
  );
}
