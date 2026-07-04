"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full border border-navy-700 bg-navy-900 px-4 py-2 text-xs font-bold uppercase tracking-wide text-cream-50 shadow-card transition hover:bg-navy-700"
    >
      Print / Save as PDF
    </button>
  );
}
