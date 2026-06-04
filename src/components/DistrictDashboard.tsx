"use client";

import type { PlatformAnalytics } from "../types/voter";

export function DistrictDashboard({ analytics }: { analytics: PlatformAnalytics }) {
  return (
    <section className="ovi-panel">
      <div className="ovi-panel-head">
        <h2>District Profiles</h2>
        <span>Turnout opportunity ranking</span>
      </div>
      <div className="ovi-table">
        <div className="ovi-table-head">
          <span>District</span><span>Registered</span><span>Voted</span><span>Did Not Vote</span><span>Turnout</span><span>Voting Location</span>
        </div>
        {analytics.districts
          .slice()
          .sort((a, b) => a.turnout_rate - b.turnout_rate)
          .map((district) => (
            <div key={district.id}>
              <span>{district.label}</span>
              <span>{district.registered.toLocaleString()}</span>
              <span>{district.voted.toLocaleString()}</span>
              <span>{district.did_not_vote.toLocaleString()}</span>
              <strong>{district.turnout_rate}%</strong>
              <span>City of Orange Township</span>
            </div>
          ))}
      </div>
    </section>
  );
}
