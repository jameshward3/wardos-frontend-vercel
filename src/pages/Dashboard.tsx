"use client";

import { DataQualityPanel } from "../components/DataQualityPanel";
import { DataUpload } from "../components/DataUpload";
import { DistrictDashboard } from "../components/DistrictDashboard";
import { FilterPanel } from "../components/FilterPanel";
import { KpiCards } from "../components/KpiCards";
import { LayerControl } from "../components/LayerControl";
import { MapView } from "../components/MapView";
import { PartyCharts } from "../components/PartyCharts";
import { TurnoutCharts } from "../components/TurnoutCharts";
import { WardDashboard } from "../components/WardDashboard";
import { useVoterStore } from "../store/useVoterStore";

export default function Dashboard() {
  const { analytics } = useVoterStore();

  return (
    <main className="ovi-app">
      <header className="ovi-hero">
        <div>
          <p>City of Orange Township, New Jersey</p>
          <h1>Orange Voter Intelligence Platform</h1>
          <span>Election participation, voter registration, and demographic analysis for Orange Township, New Jersey.</span>
        </div>
        <nav>
          <a href="#map">Map</a>
          <a href="#quality">Data Quality</a>
          <a href="#wards">Wards</a>
          <a href="#upload">Upload</a>
        </nav>
      </header>

      <KpiCards analytics={analytics} />

      <section className="ovi-workbench" id="map">
        <LayerControl />
        <MapView />
        <div className="ovi-side-stack">
          <FilterPanel />
          <DataQualityPanel analytics={analytics} />
        </div>
      </section>

      <section className="ovi-analytics-grid">
        <TurnoutCharts wards={analytics.wards} districts={analytics.districts} />
        <PartyCharts analytics={analytics} />
      </section>

      <section className="ovi-analytics-grid">
        <section className="ovi-panel">
          <div className="ovi-panel-head">
            <h2>Ballot Analysis</h2>
            <span>Method usage</span>
          </div>
          <div className="ovi-metric-list">
            {Object.entries(analytics.ballot_methods).map(([method, value]) => (
              <div key={method}><span>{method}</span><strong>{value.toLocaleString()}</strong></div>
            ))}
          </div>
        </section>
        <section className="ovi-panel">
          <div className="ovi-panel-head">
            <h2>Geographic Analysis</h2>
            <span>Street names only</span>
          </div>
          <div className="ovi-street-list">
            {analytics.streets.slice(0, 8).map((street) => (
              <div key={street.id}>
                <span>{street.label}</span>
                <strong>{street.voted} voters</strong>
                <small>{street.turnout_rate}% turnout</small>
              </div>
            ))}
          </div>
        </section>
      </section>

      <section className="ovi-panel">
        <div className="ovi-panel-head">
          <h2>Advanced Political Analytics</h2>
          <span>Campaign intelligence views</span>
        </div>
        <div className="ovi-intel-grid">
          <article><strong>Persuasion Universe</strong><span>{analytics.unaffiliated.toLocaleString()} unaffiliated voters weighted toward low-turnout districts.</span></article>
          <article><strong>GOTV Universe</strong><span>{analytics.total_voted.toLocaleString()} known participating voters segmented for frequent, occasional, and rare voting models.</span></article>
          <article><strong>Swing Areas</strong><span>{analytics.districts.filter((district) => district.turnout_rate < analytics.turnout_rate).length} districts flagged for balanced party composition or turnout gaps.</span></article>
        </div>
      </section>

      <div id="wards">
        <WardDashboard analytics={analytics} />
      </div>
      <DistrictDashboard analytics={analytics} />

      <div id="upload">
        <DataUpload />
      </div>

      <footer className="ovi-footer">
        Future-ready connectors: PostgreSQL/PostGIS, Supabase, Azure SQL, ArcGIS, canvassing, predictive turnout modeling, legislative tracker, budget dashboard, tree canopy dashboard, and WardOS integration.
      </footer>
    </main>
  );
}
