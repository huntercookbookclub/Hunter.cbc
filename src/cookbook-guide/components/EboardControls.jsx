import { useEffect, useRef, useState } from 'react';
import { isEboardUser } from '../hooks/useAuth';
import BookmarkIcon from './BookmarkIcon';

export default function EboardControls({
  currentUser,
  onOpenLogin,
  onOpenAccountSettings,
  onOpenMyRecs,
  onOpenSaved,
  onLogout,
  onOpenAddPlace,
  addLabel = '+ Add Place',
  // true on pages any logged-in account can post to (recipes, Lookback);
  // false on the map, where only e-board can add places.
  openToAll = false,
  myRecsLabel = '📍 Your Recommendations',
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  // Any logged-in account gets Account Settings (incl. Delete account), Saved and Sign Out;
  // editing tools are e-board only.
  const isEboard = isEboardUser(currentUser);
  const canPost = openToAll ? !!currentUser : isEboard;

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnOutsideClick = () => setMenuOpen(false);
    const closeOnEscape = (e) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('click', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('click', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [menuOpen]);

  const handleTriggerClick = (e) => {
    e.stopPropagation();
    if (currentUser) {
      setMenuOpen((o) => !o);
    } else {
      onOpenLogin();
    }
  };

  return (
    <>
      {/* Faint while logged out (e-board entry); fully visible once signed in so
          members can find Saved and Sign Out. */}
      <button
        className={`eboard-trigger${currentUser ? ' signed-in' : ''}`}
        title={currentUser ? 'Account' : 'Log in'}
        aria-label={currentUser ? 'Account menu' : 'Log in'}
        aria-haspopup={currentUser ? 'menu' : undefined}
        aria-expanded={currentUser ? menuOpen : undefined}
        onClick={handleTriggerClick}
      >
        ⚙️
      </button>

      <div
        className={`gear-menu${menuOpen ? ' visible' : ''}`}
        ref={menuRef}
        role="menu"
        aria-hidden={!menuOpen}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          role="menuitem"
          className="gear-menu-item"
          onClick={() => {
            setMenuOpen(false);
            onOpenAccountSettings();
          }}
        >
          👤 Account Settings
        </button>
        {canPost && onOpenMyRecs && (
          <button
            role="menuitem"
            className="gear-menu-item"
            onClick={() => {
              setMenuOpen(false);
              onOpenMyRecs();
            }}
          >
            {myRecsLabel}
          </button>
        )}
        {onOpenSaved && (
          <button
            role="menuitem"
            className="gear-menu-item"
            onClick={() => {
              setMenuOpen(false);
              onOpenSaved();
            }}
          >
            <BookmarkIcon filled /> Saved
          </button>
        )}
        <button
          role="menuitem"
          className="gear-menu-item danger"
          onClick={() => {
            setMenuOpen(false);
            onLogout();
          }}
        >
          ↩ Sign Out
        </button>
      </div>

      {/* Pages with saving get a visible way in for the public. */}
      {!currentUser && onOpenSaved && (
        <button className="add-place-btn login-btn visible" onClick={onOpenLogin}>
          Log in / Sign up
        </button>
      )}

      <button
        className={`add-place-btn${canPost ? ' visible' : ''}`}
        onClick={onOpenAddPlace}
      >
        {addLabel}
      </button>
    </>
  );
}
