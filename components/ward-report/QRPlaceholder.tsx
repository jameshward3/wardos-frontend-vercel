type QRPlaceholderProps = {
  label: string;
  variant?: "cream" | "navy";
};

/** Swap the SVG mock for a generated QR code image (see README) when links are final. */
export function QRPlaceholder({ label, variant = "cream" }: QRPlaceholderProps) {
  const isNavy = variant === "navy";
  const corner = isNavy ? "border-gold-400" : "border-navy-700";

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div
        className={`relative h-24 w-24 border p-2.5 ${
          isNavy ? "border-gold-400/50 bg-navy-800" : "border-navy-300 bg-cream-50"
        }`}
      >
        <span className={`absolute -left-1 -top-1 h-3.5 w-3.5 border-l-2 border-t-2 ${corner}`} aria-hidden="true" />
        <span className={`absolute -right-1 -top-1 h-3.5 w-3.5 border-r-2 border-t-2 ${corner}`} aria-hidden="true" />
        <span className={`absolute -bottom-1 -left-1 h-3.5 w-3.5 border-b-2 border-l-2 ${corner}`} aria-hidden="true" />
        <span className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 border-b-2 border-r-2 ${corner}`} aria-hidden="true" />
        <div className="grid h-full w-full grid-cols-4 grid-rows-4 gap-0.5" aria-hidden="true">
          {Array.from({ length: 16 }).map((_, i) => (
            <span
              key={i}
              className={`rounded-[1px] ${
                (i * 7) % 5 < 2 ? (isNavy ? "bg-gold-400" : "bg-navy-800") : "bg-transparent"
              }`}
            />
          ))}
        </div>
      </div>
      <span className={`max-w-[7rem] text-xs font-semibold ${isNavy ? "text-cream-200" : "text-navy-600"}`}>
        {label}
      </span>
    </div>
  );
}
