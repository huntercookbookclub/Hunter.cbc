import { useEffect, useRef, useState } from 'react';
import { isEboardUser } from '../hooks/useAuth';

export default function EboardControls({
  currentUser,
  onOpenLogin,
  onOpenAccountSettings,
  onOpenMyRecs,
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
      <button className="eboard-trigger" title="Eboard" onClick={handleTriggerClick}>
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

      <button
        className={`add-place-btn${isEboard ? ' visible' : ''}`}
        onClick={onOpenAddPlace}
      >
        {addLabel}
      </button>
    </>
  );
}
