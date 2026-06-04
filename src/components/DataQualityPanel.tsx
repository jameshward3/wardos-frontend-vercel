"use client";

import type { PlatformAnalytics } from "../types/voter";

export function DataQualityPanel({ analytics }: { analytics: PlatformAnalytics }) {
  const qualityRows = [
    ["Registered voter count", analytics.quality.registered_voter_count],
    ["Election voter count", analytics.quality.election_voter_count],
    ["Matched voters", analytics.quality.matched_voters],
    ["Unmatched voters", analytics.quality.unmatched_voters],
    ["Duplicate records", analytics.quality.duplicate_records],
    ["Missing districts", analytics.quality.missing_districts],
    ["Missing wards", analytics.quality.missing_wards],
    ["Missing party data", analytics.quality.missing_party_data],
    ["Missing address data", analytics.quality.missing_address_data],
  ];
  return (
    <section className="ovi-panel">
      <div className="ovi-panel-head">
        <h2>Data Validation</h2>
        <strong>{analytics.quality.data_quality_score}%</strong>
      </div>
      <div className="ovi-quality-score">
        <span style={{ width: `${analytics.quality.data_quality_score}%` }} />
      </div>
      <div className="ovi-quality-grid">
        {qualityRows.map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
