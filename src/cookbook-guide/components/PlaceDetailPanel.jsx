import { catConfig, cuisineEmoji } from '../lib/catConfig';
import BookmarkIcon from './BookmarkIcon';
import { useSheetDrag } from '../hooks/useSheetDrag';

export default function PlaceDetailPanel({ place, onClose, saved, onToggleSave }) {
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
              <button
                type="button"
                className={`save-btn${saved ? ' saved' : ''}`}
                aria-pressed={saved}
                onClick={onToggleSave}
              >
                <BookmarkIcon filled={saved} /> {saved ? 'Saved' : 'Save'}
              </button>
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
              </a>
            </div>

            <div className="panel-section-label">Recommended by</div>
            <div className="panel-recommender">
              <div className="rec-avatar" style={{ background: place.recommender.color }}>
                {place.recommender.avatarUrl ? (
                  <img
                    src={place.recommender.avatarUrl}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                  />
                ) : (
                  place.recommender.avatar
                )}
              </div>
              <div className="rec-info">
                <div className="rec-name">{place.recommender.name}</div>
                <div className="rec-role">{place.recommender.role}</div>
              </div>
            </div>

            {place.tags?.length > 0 && (
              <>
                <div className="panel-section-label">Tags</div>
                <div className="dishes-list">
                  {place.tags.map((t) => (
                    <span key={t} className="tag-pill-display">
                      {t}
                    </span>
                  ))}
                </div>
              </>
            )}

            {place.dishes?.length > 0 && (
              <>
                <div className="panel-section-label">Must-try dishes</div>
                <div className="dishes-list">
                  {place.dishes.map((d) => (
                    <span key={d} className="dish-tag">
                      {d}
                    </span>
                  ))}
                </div>
              </>
            )}

            {place.notes?.trim() && (
              <>
                <div className="panel-section-label">Notes</div>
                <div className="panel-notes">{place.notes}</div>
              </>
            )}

            {place.photos?.length > 0 && (
              <>
                <div className="panel-section-label">Photos</div>
                <div className="panel-photos">
                  {place.photos.map((url) => (
                    <div key={url} className="photo">
                      <img src={url} alt="" />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
