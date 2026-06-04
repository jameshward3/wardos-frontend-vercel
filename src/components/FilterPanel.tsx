"use client";

import { setVoterState, useVoterStore } from "../store/useVoterStore";

export function FilterPanel() {
  const { analytics, selectedWard, selectedDistrict } = useVoterStore();
  const districts = selectedWard === "All" ? analytics.districts : analytics.districts.filter((district) => district.ward === selectedWard);

  return (
    <section className="ovi-panel ovi-filters">
      <div className="ovi-panel-head">
        <h2>Filters</h2>
        <span>Cycle-ready</span>
      </div>
      <label>
        Ward
        <select value={selectedWard} onChange={(event) => setVoterState({ selectedWard: event.target.value, selectedDistrict: "All" })}>
          <option>All</option>
          {analytics.wards.map((ward) => <option key={ward.ward}>{ward.ward}</option>)}
        </select>
      </label>
      <label>
        District
        <select value={selectedDistrict} onChange={(event) => setVoterState({ selectedDistrict: event.target.value })}>
          <option>All</option>
          {districts.map((district) => <option key={district.id}>{district.label}</option>)}
        </select>
      </label>
      <label>
        Election
        <select defaultValue={analytics.election_name}>
          <option>{analytics.election_name}</option>
          <option disabled>Future cycle import</option>
        </select>
      </label>
    </section>
  );
}
