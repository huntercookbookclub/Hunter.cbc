import { useRef, useState } from 'react';

const uploaded = (date) =>
  date ? new Date(date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '';

// One recommendation: who recommended it, their tags, dishes, notes and photos.
function Review({ review }) {
  const { recommender } = review;
  return (
    <>
      <div className="panel-section-label">Recommended by</div>
      <div className={`panel-recommender banner-${recommender.banner}`}>
        <div className={`rec-avatar${recommender.hat ? ' has-hat' : ''}`} style={{ background: recommender.color }}>
          {recommender.avatarUrl ? (
            <img
              src={recommender.avatarUrl}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
            />
          ) : (
            recommender.avatar
          )}
        </div>
        <div className="rec-info">
          <div className="rec-name">{recommender.name}</div>
          <div className="rec-role">
            {[recommender.role, uploaded(review.createdAt)].filter(Boolean).join(' · ')}
          </div>
        </div>
      </div>

      {review.tags?.length > 0 && (
        <>
          <div className="panel-section-label">Tags</div>
          <div className="dishes-list">
            {review.tags.map((t) => (
              <span key={t} className="tag-pill-display">
                {t}
              </span>
            ))}
          </div>
        </>
      )}

      {review.dishes?.length > 0 && (
        <>
          <div className="panel-section-label">Must-try dishes</div>
          <div className="dishes-list">
            {review.dishes.map((d) => (
              <span key={d} className="dish-tag">
                {d}
              </span>
            ))}
          </div>
        </>
      )}

      {review.notes?.trim() && (
        <>
          <div className="panel-section-label">Notes</div>
          <div className="panel-notes">{review.notes}</div>
        </>
      )}

      {review.photos?.length > 0 && (
        <>
          <div className="panel-section-label">Photos</div>
          <div className="panel-photos">
            {review.photos.map((url) => (
              <div key={url} className="photo">
                <img src={url} alt="" />
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

// Every recommendation for a place, oldest first. With more than one, they sit
// side by side in a native swipe row (scroll-snap: the browser's own physics),
// with a count, "1 of 2" and arrow buttons for mouse and keyboard users.
export default function ReviewsCarousel({ reviews }) {
  const trackRef = useRef(null);
  const [index, setIndex] = useState(0);
  const count = reviews.length;

  if (count === 1) return <Review review={reviews[0]} />;

  const onScroll = () => {
    const track = trackRef.current;
    setIndex(Math.round(track.scrollLeft / track.clientWidth));
  };

  const go = (i) => {
    const track = trackRef.current;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    track.scrollTo({ left: i * track.clientWidth, behavior: reduce ? 'auto' : 'smooth' });
  };

  return (
    <section className="reviews" aria-roledescription="carousel" aria-label={`${count} recommendations`}>
      <div className="reviews-head">
        <span className="reviews-count">{count} recommendations</span>
        <div className="reviews-nav">
          <button type="button" aria-label="Previous recommendation" disabled={index === 0} onClick={() => go(index - 1)}>
            ‹
          </button>
          <span className="reviews-pos" aria-live="polite">
            {index + 1} of {count}
          </span>
          <button
            type="button"
            aria-label="Next recommendation"
            disabled={index === count - 1}
            onClick={() => go(index + 1)}
          >
            ›
          </button>
        </div>
      </div>

      <div className="reviews-track" ref={trackRef} onScroll={onScroll}>
        {reviews.map((review, i) => (
          <article
            key={review.id}
            className="review"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}`}
            aria-hidden={i !== index}
          >
            <Review review={review} />
          </article>
        ))}
      </div>

      <div className="reviews-dots" aria-hidden="true">
        {reviews.map((review, i) => (
          <span key={review.id} className={i === index ? 'on' : ''} />
        ))}
      </div>
    </section>
  );
}
