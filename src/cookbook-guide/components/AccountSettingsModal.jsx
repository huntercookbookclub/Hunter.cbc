import { useEffect, useState } from 'react';
import Modal from './Modal';
import ProfileChip from './ProfileChip';
import { sbClient } from '../lib/supabaseClient';
import { deleteMyAccount, isDisplayNameAvailable, isEboardUser, NAME_TAKEN_MESSAGE } from '../hooks/useAuth';
import { useShowActivity } from '../hooks/useProfile';
import { setThemeChoice, useThemeChoice } from '../../theme';

export default function AccountSettingsModal({ open, onClose, currentUser, onSaved }) {
  const theme = useThemeChoice();
  const [role, setRole] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [removeFlag, setRemoveFlag] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  // Everyone has a picture and a display name; e-board also have a role,
  // shown on their places and recipes.
  const isEboard = isEboardUser(currentUser);
  const [displayName, setDisplayName] = useState('');
  const { showActivity, setShowActivity } = useShowActivity(currentUser);
  const [share, setShare] = useState(false);
  const [banner, setBanner] = useState('default');
  const [hat, setHat] = useState(false);
  const [tab, setTab] = useState('account');
  // Delete account: hidden until asked for, then needs the current password.
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (open) {
      const meta = currentUser?.user_metadata || {};
      setRole(meta.role || '');
      setDisplayName(meta.display_name || '');
      setAvatarUrl(meta.avatar_url || null);
      setBanner(meta.banner || 'default');
      setHat(!!meta.hat);
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
      setTab('account');
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
    if (!name || name.length > 40) {
      setError('Add a display name (up to 40 characters).');
      return;
    }
    let finalAvatarUrl = currentUser?.user_metadata?.avatar_url || null;

    setSaving(true);

    const meta = currentUser?.user_metadata || {};
    const oldName = (meta.display_name || '').trim();
    if (name.toLowerCase() !== oldName.toLowerCase() && !(await isDisplayNameAvailable(name))) {
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
      data: {
        display_name: name,
        avatar_url: finalAvatarUrl,
        banner,
        hat,
        ...(isEboard && { role: role.trim() }),
      },
    });

    // Places and recipes keep a copy of the poster's name, role and picture.
    // Bring this account's copies up to date.
    if (!updateErr) {
      const roleLabel = role.trim() || 'Eboard';
      await sbClient
        .from('recipes')
        .update({
          author: name,
          author_role: isEboard ? roleLabel : null,
          author_avatar_url: finalAvatarUrl,
          author_banner: banner,
          author_hat: hat,
        })
        .eq('author_id', currentUser.id);
      const placeCopy = {
        recommender_name: name,
        recommender_role: isEboard ? roleLabel : null,
        recommender_avatar_url: finalAvatarUrl,
        recommender_banner: banner,
        recommender_hat: hat,
      };
      await sbClient.from('places').update(placeCopy).eq('author_id', currentUser.id);
      // E-board places from before author_id was recorded: matched by name.
      if (isEboard && oldName) {
        await sbClient.from('places').update(placeCopy).is('author_id', null).eq('recommender_name', oldName);
      }
    }

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

  const tabs = [
    ['account', 'Account'],
    ['appearance', 'Appearance'],
    ['privacy', 'Privacy'],
  ];

  // Two-option switch, same look as the theme one.
  const segment = (name, value, onChange, options) => (
    <div className="e-segment" role="radiogroup" aria-labelledby={`${name}-label`} style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map(([v, label]) => (
        <label key={String(v)}>
          <input type="radio" name={name} checked={value === v} onChange={() => onChange(v)} />
          {label}
        </label>
      ))}
    </div>
  );

  const saveButton = (
    <>
      <div className="e-error">{error}</div>
      <button className="e-btn-primary" onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save'}
      </button>
    </>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Settings"
      width="clamp(300px, 92vw, 580px)"
      bodyClassName="settings-body"
    >
      <div className="settings-nav" role="tablist" aria-label="Settings">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`settings-tab-${id}`}
            aria-selected={tab === id}
            aria-controls="settings-pane"
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="settings-pane" id="settings-pane" role="tabpanel" aria-labelledby={`settings-tab-${tab}`}>
        {tab === 'account' && (
          <>
            {/* Live preview of how you show on places you recommend. */}
            <ProfileChip
              name={displayName.trim() || 'Your name'}
              sub={[isEboard && (role.trim() || 'Eboard'), 'Preview'].filter(Boolean).join(' · ')}
              avatarUrl={avatarUrl}
              banner={banner}
              hat={hat}
              style={{ marginBottom: 4 }}
            />

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
                  <span>{(displayName || '?')[0].toUpperCase()}</span>
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
            <input
              type="text"
              className="e-input"
              placeholder="e.g. Maya C."
              autoComplete="nickname"
              maxLength={40}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />

            {isEboard && (
              <>
                <div className="e-section-label">Role</div>
                <input
                  type="text"
                  className="e-input"
                  placeholder="e.g. President, Treasurer..."
                  maxLength={40}
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                />
                <p className="e-hint">Shown with your name on places and recipes you post.</p>
              </>
            )}

            <div className="e-section-label" id="banner-label">Banner</div>
            {segment('banner', banner, setBanner, [
              ['default', 'Default'],
              ['gingham', 'Plaid'],
            ])}

            <div className="e-section-label" id="hat-label">Hat</div>
            {segment('hat', hat, setHat, [
              [false, 'No hat'],
              [true, 'Chef hat'],
            ])}
            <p className="e-hint">Shown on places you recommend.</p>

            {saveButton}

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
          </>
        )}

        {tab === 'appearance' && (
          <>
            {/* Applies right away and is saved on this device, no Save needed. */}
            <div className="e-section-label" id="theme-label">Theme</div>
            {segment('theme', theme, setThemeChoice, [
              ['auto', 'Auto'],
              ['light', 'Light'],
              ['dark', 'Dark'],
            ])}
            <p className="e-hint">
              {theme === 'auto' ? 'Follows your device’s light or dark setting. ' : ''}Applies right away on this device.
            </p>
          </>
        )}

        {tab === 'privacy' && (
          <>
            <div className="e-section-label">Likes and saves</div>
            <label className="e-check">
              <input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} />
              <span>
                <strong>Show my name and photo on places and recipes I like or save.</strong> Keep unticked to keep
                likes and saves private.
              </span>
            </label>
            {saveButton}
          </>
        )}
      </div>
    </Modal>
  );
}
