"use client";

import { setVoterState, useVoterStore } from "../store/useVoterStore";

export function FilterPanel() {
  const { analytics, selectedWard, selectedDistrict, selectedParty, selectedAgeBand, selectedGender } = useVoterStore();
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
      <label>
        Party
        <select value={selectedParty} onChange={(event) => setVoterState({ selectedParty: event.target.value as typeof selectedParty })}>
          <option>All</option>
          <option value="DEM">Democrats</option>
          <option value="REP">Republicans</option>
          <option value="UNA">Unaffiliated</option>
          <option value="OTHER">Other</option>
        </select>
      </label>
      <label>
        Age
        <select value={selectedAgeBand} onChange={(event) => setVoterState({ selectedAgeBand: event.target.value as typeof selectedAgeBand })}>
          <option>All</option>
          <option>18-29</option>
          <option>30-44</option>
          <option>45-64</option>
          <option>65+</option>
          <option>Unknown</option>
        </select>
      </label>
      <label>
        Gender
        <select value={selectedGender} onChange={(event) => setVoterState({ selectedGender: event.target.value as typeof selectedGender })}>
          <option>All</option>
          <option>Male</option>
          <option>Female</option>
          <option>Unknown</option>
        </select>
      </label>
    </section>
  );
}
