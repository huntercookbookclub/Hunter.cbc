// Outline icons, 1em, text color, stroke 2 (matches the text weight).
const Icon = ({ d }) => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

export const FilterIcon = () => (
  <Icon d="M5 4h14a1 1 0 0 1 1 1v1.2a1 1 0 0 1-.24.65L14 13.5V19a1 1 0 0 1-.55.9l-2 1A1 1 0 0 1 10 20v-6.5L4.24 6.85A1 1 0 0 1 4 6.2V5a1 1 0 0 1 1-1z" />
);

export const BellIcon = () => (
  <Icon d="M6 9a6 6 0 0 1 12 0c0 4.5 1.5 6.5 2.5 7.5h-17C4.5 15.5 6 13.5 6 9zM10 19.5a2 2 0 0 0 4 0" />
);
