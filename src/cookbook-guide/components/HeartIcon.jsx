import ToggleGlyph from './ToggleGlyph';

const HEART =
  'M12 20.5s-7.6-4.6-9.4-9.5C1.3 7.6 3.5 4 7.1 4c2.1 0 3.7 1.1 4.9 2.8C13.2 5.1 14.8 4 16.9 4c3.6 0 5.8 3.6 4.5 7-1.8 4.9-9.4 9.5-9.4 9.5z';

// Heart icon for liking places: solid when liked, outline when not.
export default function HeartIcon({ filled = false }) {
  return <ToggleGlyph path={HEART} on={filled} />;
}
