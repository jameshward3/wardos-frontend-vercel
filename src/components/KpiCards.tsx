"use client";

import type { PlatformAnalytics } from "../types/voter";

const numberFormat = new Intl.NumberFormat("en-US");

export function KpiCards({ analytics }: { analytics: PlatformAnalytics }) {
  const cards = [
    ["Total Registered Voters", numberFormat.format(analytics.total_registered), "Master voter universe"],
    ["Total Voters Participating", numberFormat.format(analytics.total_voted), analytics.election_name],
    ["Turnout %", `${analytics.turnout_rate}%`, "Election participation"],
    ["Democrats", numberFormat.format(analytics.democrats), "Registration or party voted"],
    ["Republicans", numberFormat.format(analytics.republicans), "Registration or party voted"],
    ["Unaffiliated", numberFormat.format(analytics.unaffiliated), "Potential persuasion universe"],
    ["Average Age", String(analytics.average_age), "Model-ready demographic field"],
    ["Most Active District", analytics.most_active_district, "Highest turnout rate"],
    ["Least Active District", analytics.least_active_district, "Lowest turnout rate"],
  ];

  return (
    <section className="ovi-kpis">
      {cards.map(([label, value, note]) => (
        <article className="ovi-kpi" key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
          <small>{note}</small>
        </article>
      ))}
    </section>
  );
}
