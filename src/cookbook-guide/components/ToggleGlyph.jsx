// An icon with an outline and a filled state (bookmark, heart). Both are drawn
// stacked; switching cross-fades them, blurring the outgoing one. Sized to the
// text (1em) and colored with the text color.
export default function ToggleGlyph({ path, on = false }) {
  return (
    <span className="toggle-glyph" data-on={on} aria-hidden="true">
      <svg className="glyph-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
        <path d={path} />
      </svg>
      <svg className="glyph-on" viewBox="0 0 24 24" fill="currentColor">
        <path d={path} />
      </svg>
    </span>
  );
}
