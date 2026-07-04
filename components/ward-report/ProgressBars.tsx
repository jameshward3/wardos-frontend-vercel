import type { AgendaItem } from "../../lib/ward-report-data";

type ProgressBarsProps = {
  items: AgendaItem[];
};

export function ProgressBars({ items }: ProgressBarsProps) {
  return (
    <div className="flex flex-col gap-5">
      {items.map((item) => (
        <div key={item.label} className="break-inside-avoid">
          <div className="flex items-baseline justify-between gap-4">
            <span className="font-serif text-base font-bold text-navy-900">{item.label}</span>
            <span className="font-serif text-base font-bold text-gold-600">{item.value}%</span>
          </div>
          <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-cream-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-navy-700 to-gold-500"
              style={{ width: `${Math.min(100, Math.max(0, item.value))}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-navy-600">{item.description}</p>
        </div>
      ))}
    </div>
  );
}
