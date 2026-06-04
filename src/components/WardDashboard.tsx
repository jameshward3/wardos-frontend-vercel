"use client";

import type { PlatformAnalytics } from "../types/voter";

export function WardDashboard({ analytics }: { analytics: PlatformAnalytics }) {
  return (
    <section className="ovi-panel">
      <div className="ovi-panel-head">
        <h2>Ward Analytics</h2>
        <span>North, South, East, and West profiles</span>
      </div>
      <div className="ovi-profile-grid">
        {analytics.wards.map((ward) => (
          <article key={ward.ward} className="ovi-profile">
            <div>
              <h3>{ward.label}</h3>
              <strong>{ward.turnout_rate}%</strong>
            </div>
            <dl>
              <dt>Registered</dt><dd>{ward.registered.toLocaleString()}</dd>
              <dt>Voted</dt><dd>{ward.voted.toLocaleString()}</dd>
              <dt>Dem / Rep / Una</dt><dd>{ward.democrats} / {ward.republicans} / {ward.unaffiliated}</dd>
              <dt>Average age</dt><dd>{ward.average_age}</dd>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}
