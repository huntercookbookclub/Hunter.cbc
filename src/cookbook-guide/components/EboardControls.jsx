import { useEffect, useRef, useState } from "react";
import { isEboardUser } from "../hooks/useAuth";
import BookmarkIcon from "./BookmarkIcon";
import NotificationBell from "./NotificationBell";

export default function EboardControls({
  currentUser,
  onOpenLogin,
  onOpenAccountSettings,
  onOpenMyRecs,
  onOpenSaved,
  onLogout,
  onOpenAddPlace,
  addLabel = "+ Add Place",
  // true on pages any logged-in account can post to (recipes, Lookback);
  // false on the map, where only e-board can add places.
  openToAll = false,
  myRecsLabel = "📍 Your Recommendations",
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const triggerRef = useRef(null);
  // Any logged-in account gets Account Settings (incl. Delete account), Saved and Sign Out;
  // editing tools are e-board only.
  const isEboard = isEboardUser(currentUser);
  const canPost = openToAll ? !!currentUser : isEboard;

  useEffect(() => {
    if (!menuOpen) return;
    // Any press outside the gear and its menu (the bell included) closes it.
    const closeOnOutsideClick = (e) => {
      if (!menuRef.current?.contains(e.target) && !triggerRef.current?.contains(e.target)) setMenuOpen(false);
    };
    const closeOnEscape = (e) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  const handleTriggerClick = () => {
    if (currentUser) {
      setMenuOpen((o) => !o);
    } else {
      onOpenLogin();
    }
  };

  return (
    <>
      <NotificationBell signedIn={!!currentUser} />
      {/* Settings gear only for logged-in accounts; logged out sees "Log in / Sign up". */}
      {currentUser && (
        <>
          <button
            ref={triggerRef}
            className={`eboard-trigger${currentUser ? " signed-in" : ""}`}
            title={currentUser ? "Account" : "Log in"}
            aria-label={currentUser ? "Account menu" : "Log in"}
            aria-haspopup={currentUser ? "menu" : undefined}
            aria-expanded={currentUser ? menuOpen : undefined}
            onClick={handleTriggerClick}
          >
            ⚙️
          </button>

          <div
            className={`gear-menu${menuOpen ? " visible" : ""}`}
            ref={menuRef}
            role="menu"
            aria-hidden={!menuOpen}

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
        </>
      )}

      {!currentUser && (
        <button
          className="add-place-btn login-btn visible"
          onClick={onOpenLogin}
        >
          Log in / Sign up
        </button>
      )}

      <button
        className={`add-place-btn${canPost && onOpenAddPlace ? " visible" : ""}`}
        onClick={onOpenAddPlace}
      >
        {addLabel}
      </button>
    </>
  );
}
