import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchRecentUploads } from '../../data/recent';
import { BellIcon } from './Icons';

// Bell in the top-right corner: the newest places, recipes and Lookback photos
// from every page. A dot shows when something was posted since you last looked
// (remembered on this device).
const SEEN_KEY = 'notificationsSeenAt';

const readSeen = () => {
  try {
    return Number(localStorage.getItem(SEEN_KEY)) || 0;
  } catch {
    return 0;
  }
};

const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
function timeAgo(date) {
  const s = (new Date(date) - Date.now()) / 1000;
  for (const [unit, secs] of [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]]) {
    if (Math.abs(s) >= secs) return rtf.format(Math.round(s / secs), unit);
  }
  return 'just now';
}

export default function NotificationBell({ signedIn }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(null);
  const [seenAt, setSeenAt] = useState(readSeen);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    fetchRecentUploads().then(setItems).catch(() => setItems([]));
  }, []);

  useEffect(() => {
    if (!open) return;
    // Any press outside the bell and its list (the gear included) closes it.
    const close = (e) => {
      if (!menuRef.current?.contains(e.target) && !buttonRef.current?.contains(e.target)) setOpen(false);
    };
    const closeOnEscape = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const unread = !!items?.some((i) => new Date(i.at) > seenAt);

  const toggle = () => {
    if (!open) {
      const now = Date.now();
      try {
        localStorage.setItem(SEEN_KEY, String(now));
      } catch {
        /* still works for this visit */
      }
      // Keep this visit's dots on the list; clear the badge next time.
      setTimeout(() => setSeenAt(now), 0);
    }
    setOpen((o) => !o);
  };

  return (
    <>
      <button
        className={`notif-bell${signedIn ? ' signed-in' : ''}`}
        aria-label={unread ? 'Recent uploads, new posts' : 'Recent uploads'}
        title="Recent uploads"
        aria-expanded={open}
        ref={buttonRef}
        onClick={toggle}
      >
        <BellIcon />
        {unread && <span className="notif-dot" />}
      </button>

      <div
        className={`gear-menu notif-menu${signedIn ? ' signed-in' : ''}${open ? ' visible' : ''}`}
        ref={menuRef}
        aria-hidden={!open}
      >
        <div className="notif-title">Recent uploads</div>
        {items === null && <div className="notif-empty">Loading…</div>}
        {items?.length === 0 && <div className="notif-empty">Nothing posted yet.</div>}
        <ul className="notif-list">
          {items?.map((item) => (
            <li key={item.key}>
              <Link to={item.to} className="notif-item" onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>
                <span className="notif-meta">
                  {item.page} · {timeAgo(item.at)}
                </span>
                <span className="notif-text">
                  <strong>{item.who || 'Member'}</strong> {item.verb} <strong>{item.what}</strong>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
