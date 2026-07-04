type ImagePlaceholderProps = {
  label: string;
  className?: string;
};

/** Swap for a real <img>/<Image> once photography is available. */
export function ImagePlaceholder({ label, className = "" }: ImagePlaceholderProps) {
  return (
    <div
      className={`flex min-h-[9rem] w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-navy-300 bg-cream-100 text-center print:border-navy-400 ${className}`}
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-navy-400" aria-hidden="true">
        <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="8" cy="10" r="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M4 17l5-5 4 4 3-3 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="px-3 text-xs font-semibold uppercase tracking-wide text-navy-500">{label}</span>
    </div>
  );
}
