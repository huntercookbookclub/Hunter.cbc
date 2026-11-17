import { catConfig, cuisineEmoji } from '../lib/catConfig';
import BookmarkIcon from './BookmarkIcon';
import HeartIcon from './HeartIcon';
import ExternalLinkIcon from './ExternalLinkIcon';
import ReviewsCarousel from './ReviewsCarousel';
import { useSheetDrag } from '../hooks/useSheetDrag';

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

// Up to 3 random people who liked or saved this place and opted in to showing
// it, floating beside the card, each with a heart and/or bookmark badge; the
// rest as "+X". Nobody appears here unless they turned the switch on.
function ActivityFaces({ activity }) {
  const { faces, total } = activity;
  if (faces.length === 0) return null;
  const extra = total - faces.length;
  return (
    <ul className="activity-faces" aria-label={`${total} ${total === 1 ? 'person' : 'people'} liked or saved this`}>
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

export default function PlaceDetailPanel({
  place,
  onClose,
  saved,
  onToggleSave,
  liked,
  likes,
  onToggleLike,
  activity,
  loggedIn,
  showActivity,
  onSetShowActivity,
}) {
  const isOpen = !!place;
  const cfg = place ? catConfig[place.category] : null;
  const { sheetRef, handleProps } = useSheetDrag(onClose);

  return (
    <div
      ref={sheetRef}
      className={`side-panel${isOpen ? ' open' : ''}`}
      role="region"
      aria-label={place ? place.name : 'Place details'}
    >
      {place && activity && <ActivityFaces activity={activity} />}

      {/* Phone only: drag down to close. */}
      <div className="sheet-handle" aria-hidden="true" {...handleProps}>
        <span />
      </div>
      <button className="panel-close" title="Close" aria-label="Close place details" onClick={onClose}>
        ✕
      </button>

      <div className="panel-scroll">
        {place && (
          <div className="panel-body">
            <div className="panel-name-row">
              <span className="badge-emoji">{cfg.emoji}</span>
              <span
                className="cat-badge"
                style={{ background: cfg.bg, color: cfg.color }}
              >
                {cfg.label}
              </span>
              {place.cuisine && (
                <>
                  <span className="badge-emoji">{cuisineEmoji[place.cuisine] || '🍴'}</span>
                  <span className="cuisine-badge">{place.cuisine}</span>
                </>
              )}
            </div>

            <div className="panel-name">
              <span>{place.name}</span>
            </div>

            <div className="panel-address">
              📍{' '}
              <a
                href={
                  place.maps_url ||
                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}`
                }
                target="_blank"
                rel="noopener noreferrer"
                title="Open in Google Maps"
              >
                {place.address}
                <ExternalLinkIcon />
                <span className="visually-hidden"> (opens Google Maps in a new tab)</span>
              </a>
            </div>

            {/* key resets the swipe position when another place opens */}
            <ReviewsCarousel key={place.id} reviews={place.reviews || [place]} />
          </div>
        )}
      </div>

      {/* Actions pinned to the bottom of the card, always in reach. */}
      {place && (
        <div className="panel-actions">
          <button
            type="button"
            className={`panel-action like${liked ? ' active' : ''}`}
            aria-pressed={liked}
            aria-label={`${liked ? 'Unlike' : 'Like'} ${place.name}${likes ? `, ${likes} likes` : ''}`}
            onClick={onToggleLike}
          >
            <HeartIcon filled={liked} />
            <span>{liked ? 'Liked' : 'Like'}</span>
            {likes > 0 && <span className="action-count">{likes}</span>}
          </button>
          <button
            type="button"
            className={`panel-action save${saved ? ' active' : ''}`}
            aria-pressed={saved}
            onClick={onToggleSave}
          >
            <BookmarkIcon filled={saved} />
            <span>{saved ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      )}

      {/* Says plainly who can see your likes and saves, with the switch right here. */}
      {place && loggedIn && (
        <p className="activity-note">
          {showActivity ? (
            <>
              Your name and photo show on places you like or save.{' '}
              <button type="button" onClick={() => onSetShowActivity(false)}>
                Turn off
              </button>
            </>
          ) : (
            <>
              Your likes and saves are private.{' '}
              <button type="button" onClick={() => onSetShowActivity(true)}>
                Show my name on places
              </button>
            </>
          )}
        </p>
      )}
    </div>
  );
}
