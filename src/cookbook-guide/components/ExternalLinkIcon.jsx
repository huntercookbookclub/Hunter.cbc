// "Opens in a new tab" icon: a box with an arrow leaving its top-right corner.
// Sized to the text (1em) and colored with the text color.
export default function ExternalLinkIcon() {
  return (
    <svg
      className="external-link-icon"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-4" />
      <path d="M13 3h8v8" />
      <path d="M21 3l-9.5 9.5" />
    </svg>
  );
}
