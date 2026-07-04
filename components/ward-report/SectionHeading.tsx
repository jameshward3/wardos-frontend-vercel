type SectionHeadingProps = {
  kicker: string;
  title: string;
  description?: string;
};

export function SectionHeading({ kicker, title, description }: SectionHeadingProps) {
  return (
    <div className="mb-6 flex flex-col gap-2 break-inside-avoid">
      <div className="flex items-center gap-2.5">
        <span className="h-2.5 w-2.5 shrink-0 bg-gold-500" aria-hidden="true" />
        <span className="text-xs font-bold uppercase tracking-[0.25em] text-gold-600">{kicker}</span>
      </div>
      <h2 className="font-sans text-2xl font-extrabold uppercase tracking-wide text-navy-900 sm:text-3xl">
        {title}
      </h2>
      {description ? <p className="max-w-2xl text-sm text-navy-600">{description}</p> : null}
      <div className="mt-1 h-1 w-16 rounded-full bg-gold-500" />
    </div>
  );
}
