type CouncilMarkProps = {
  className?: string;
};

/** Decorative gold council seal used on the cover masthead. */
export function CouncilMark({ className = "h-20 w-20" }: CouncilMarkProps) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <circle cx="60" cy="60" r="57" fill="#c9a227" />
      <circle cx="60" cy="60" r="49" fill="#0b1626" stroke="#dcb95f" strokeWidth="2" />
      <circle cx="60" cy="60" r="42" fill="none" stroke="#dcb95f" strokeWidth="1" strokeDasharray="1.5 4.5" />
      <path
        d="M60 32 L69.4 51.3 L90.9 51.3 L73.7 63.4 L80 84.6 L60 71.5 L40 84.6 L46.3 63.4 L29.1 51.3 L50.6 51.3 Z"
        fill="#dcb95f"
      />
    </svg>
  );
}
