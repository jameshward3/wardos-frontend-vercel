"use client";

import { setVoterState, useVoterStore } from "../store/useVoterStore";

const layers = [
  ["turnout", "Turnout %"],
  ["registered", "Registered"],
  ["party", "Party"],
  ["ballot", "Ballot Method"],
  ["persuasion", "Persuasion"],
  ["gotv", "GOTV"],
  ["swing", "Swing Areas"],
] as const;

const geographies = [
  ["ward", "Ward"],
  ["district", "District"],
  ["street", "Street"],
] as const;

export function LayerControl() {
  const state = useVoterStore();

  return (
    <aside className="ovi-panel ovi-layer-control">
      <div className="ovi-panel-head">
        <h2>Map Layers</h2>
        <span>OSM-ready</span>
      </div>
      <div className="ovi-control-group">
        <label>Analysis Layer</label>
        <div className="ovi-segments">
          {layers.map(([value, label]) => (
            <button className={state.layerMode === value ? "active" : ""} key={value} onClick={() => setVoterState({ layerMode: value })}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="ovi-control-group">
        <label>Geography</label>
        <div className="ovi-segments compact">
          {geographies.map(([value, label]) => (
            <button className={state.geographyMode === value ? "active" : ""} key={value} onClick={() => setVoterState({ geographyMode: value })}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <label className="ovi-range">
        <span>Layer Opacity</span>
        <input min="30" max="100" value={state.opacity} type="range" onChange={(event) => setVoterState({ opacity: Number(event.target.value) })} />
      </label>
      <div className="ovi-legend">
        <span><i className="low" /> Low</span>
        <span><i className="mid" /> Moderate</span>
        <span><i className="high" /> High</span>
      </div>
    </aside>
  );
}
