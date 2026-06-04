"use client";

import type { GeographyMetric } from "../types/voter";

function Bars({ data, value, suffix = "" }: { data: GeographyMetric[]; value: keyof GeographyMetric; suffix?: string }) {
  const max = Math.max(1, ...data.map((item) => Number(item[value])));
  return (
    <div className="ovi-bars">
      {data.map((item) => (
        <div className="ovi-bar-row" key={item.id}>
          <span>{item.label}</span>
          <div><i style={{ width: `${(Number(item[value]) / max) * 100}%` }} /></div>
          <strong>{Number(item[value]).toLocaleString()}{suffix}</strong>
        </div>
      ))}
    </div>
  );
}

export function TurnoutCharts({ wards, districts }: { wards: GeographyMetric[]; districts: GeographyMetric[] }) {
  return (
    <section className="ovi-panel">
      <div className="ovi-panel-head">
        <h2>Turnout Analysis</h2>
        <span>Ward and district performance</span>
      </div>
      <div className="ovi-chart-grid">
        <div>
          <h3>Voters by Ward</h3>
          <Bars data={wards} value="voted" />
        </div>
        <div>
          <h3>Turnout by District</h3>
          <Bars data={districts} value="turnout_rate" suffix="%" />
        </div>
      </div>
    </section>
  );
}
