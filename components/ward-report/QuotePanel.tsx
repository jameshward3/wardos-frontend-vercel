type QuotePanelProps = {
  quote: string;
  attribution: string;
};

/** Right-side navy pull-quote panel used on the closing spread. */
export function QuotePanel({ quote, attribution }: QuotePanelProps) {
  return (
    <div className="flex h-full flex-col justify-center gap-5 rounded-xl bg-navy-900 p-8 text-cream-50 shadow-panel sm:p-10">
      <span className="font-serif text-6xl leading-none text-gold-500" aria-hidden="true">
        &ldquo;
      </span>
      <p className="font-serif text-xl italic leading-relaxed text-cream-100 sm:text-2xl">{quote}</p>
      <div className="h-px w-12 bg-gold-500" />
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-400">{attribution}</p>
    </div>
  );
}
