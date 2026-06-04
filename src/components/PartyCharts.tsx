"use client";

import type { PlatformAnalytics } from "../types/voter";

export function PartyCharts({ analytics }: { analytics: PlatformAnalytics }) {
  const total = Math.max(1, analytics.democrats + analytics.republicans + analytics.unaffiliated + analytics.other_parties);
  const segments = [
    ["Democrats", analytics.democrats, "#2f7dd1"],
    ["Republicans", analytics.republicans, "#a65f5f"],
    ["Unaffiliated", analytics.unaffiliated, "#d6b46d"],
    ["Other", analytics.other_parties, "#728093"],
  ] as const;
  let offset = 25;
  const gradient = segments
    .map(([, value, color]) => {
      const start = offset;
      offset += (value / total) * 100;
      return `${color} ${start}% ${offset}%`;
    })
    .join(", ");

  return (
    <section className="ovi-panel">
      <div className="ovi-panel-head">
        <h2>Party Analysis</h2>
        <span>Registration and primary participation</span>
      </div>
      <div className="ovi-donut-layout">
        <div className="ovi-donut" style={{ background: `conic-gradient(${gradient})` }}>
          <div><strong>{analytics.turnout_rate}%</strong><span>Turnout</span></div>
        </div>
        <div className="ovi-party-list">
          {segments.map(([label, value, color]) => (
            <div key={label}>
              <i style={{ background: color }} />
              <span>{label}</span>
              <strong>{value.toLocaleString()}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
