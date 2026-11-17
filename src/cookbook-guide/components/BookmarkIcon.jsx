// Bookmark icon for saving places and recipes: solid when saved, outline when not.
// Sized to the text (1em) and colored with the text color.
export default function BookmarkIcon({ filled = false }) {
  return (
    <svg
      className="bookmark-icon"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      aria-hidden="true"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 2}
      strokeLinejoin="round"
    >
      <path d="M7 2.5h10a2.5 2.5 0 0 1 2.5 2.5v15.6a1 1 0 0 1-1.6.8L12 16.9l-5.9 4.5a1 1 0 0 1-1.6-.8V5A2.5 2.5 0 0 1 7 2.5z" />
    </svg>
  );
}
