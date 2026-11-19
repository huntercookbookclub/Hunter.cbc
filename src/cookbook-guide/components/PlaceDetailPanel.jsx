import { catConfig, cuisineEmoji } from '../lib/catConfig';
import BookmarkIcon from './BookmarkIcon';
import HeartIcon from './HeartIcon';
import ExternalLinkIcon from './ExternalLinkIcon';
import ReviewsCarousel from './ReviewsCarousel';
import ActivityFaces, { ActivityNote } from './ActivityFaces';
import { useSheetDrag } from '../hooks/useSheetDrag';

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
  const cfg = place ? catConfig[place.category] || catConfig.cafe : null;
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

      {place && loggedIn && (
        <ActivityNote showActivity={showActivity} onSetShowActivity={onSetShowActivity} />
      )}
    </div>
  );
}
