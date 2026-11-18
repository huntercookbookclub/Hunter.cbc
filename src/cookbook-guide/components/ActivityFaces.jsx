import BookmarkIcon from './BookmarkIcon';
import HeartIcon from './HeartIcon';

// A steady color per name for people without a profile picture.
function faceColor(name) {
  let hash = 0;
  for (const ch of name || '?') hash = (hash * 31 + ch.charCodeAt(0)) % 360;
  return `oklch(72% 0.12 ${hash})`;
}

function verb(face) {
  if (face.liked && face.saved) return 'liked and saved this';
  return face.liked ? 'liked this' : 'saved this';
}

// Up to 3 random people who liked or saved this (a place or a recipe) and opted
// in to showing it, each with a heart and/or bookmark badge; the rest as "+X".
// Nobody appears here unless they turned the switch on.
// `inline`: sit in the page flow (recipe book) instead of floating beside a card.
export default function ActivityFaces({ activity, inline = false }) {
  const { faces, total } = activity;
  if (faces.length === 0) return null;
  const extra = total - faces.length;
  return (
    <ul
      className={`activity-faces${inline ? ' inline' : ''}`}
      aria-label={`${total} ${total === 1 ? 'person' : 'people'} liked or saved this`}
    >
      {faces.map((face, i) => (
        <li key={`${face.name}-${i}`} className="face" title={`${face.name || 'Someone'} ${verb(face)}`}>
          {face.avatar_url ? (
            <img src={face.avatar_url} alt="" />
          ) : (
            <span className="face-initial" style={{ background: faceColor(face.name) }} aria-hidden="true">
              {(face.name || '?')[0].toUpperCase()}
            </span>
          )}
          <span className="face-badge" aria-hidden="true">
            {face.liked && (
              <span className="face-badge-like">
                <HeartIcon filled />
              </span>
            )}
            {face.saved && (
              <span className="face-badge-save">
                <BookmarkIcon filled />
              </span>
            )}
          </span>
          <span className="visually-hidden">
            {face.name || 'Someone'} {verb(face)}
          </span>
        </li>
      ))}
      {extra > 0 && (
        <li className="face more" title={`${extra} more`}>
          +{extra}
        </li>
      )}
    </ul>
  );
}

// Says plainly who can see your likes and saves, with the switch right there.
export function ActivityNote({ showActivity, onSetShowActivity, className = 'activity-note' }) {
  return (
    <p className={className}>
      {showActivity ? (
        <>
          Your name and photo show on places and recipes you like or save.{' '}
          <button type="button" onClick={() => onSetShowActivity(false)}>
            Turn off
          </button>
        </>
      ) : (
        <>
          Your likes and saves are private.{' '}
          <button type="button" onClick={() => onSetShowActivity(true)}>
            Show my name on them
          </button>
        </>
      )}
    </p>
  );
}
