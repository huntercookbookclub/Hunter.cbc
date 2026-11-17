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
  myRecsLabel = '📍 Your Recommendations',
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  // Logged-in non-e-board accounts only get Sign Out; editing tools are e-board only.
  const isEboard = isEboardUser(currentUser);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnOutsideClick = () => setMenuOpen(false);
    document.addEventListener('click', closeOnOutsideClick);
    return () => document.removeEventListener('click', closeOnOutsideClick);
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
        onClick={handleTriggerClick}
      >
        ⚙️
      </button>

      <div
        className={`gear-menu${menuOpen ? ' visible' : ''}`}
        ref={menuRef}
        onClick={(e) => e.stopPropagation()}
      >
        {isEboard && (
          <button
            className="gear-menu-item"
            onClick={() => {
              setMenuOpen(false);
              onOpenAccountSettings();
            }}
          >
            👤 Account Settings
          </button>
        )}
        {isEboard && onOpenMyRecs && (
          <button
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
        className={`add-place-btn${isEboard ? ' visible' : ''}`}
        onClick={onOpenAddPlace}
      >
        {addLabel}
      </button>
    </>
  );
}
