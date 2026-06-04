"use client";

import { districtPoints, opacityForRate, wardPolygons } from "../lib/geoProcessing";
import { setVoterState, useVoterStore } from "../store/useVoterStore";

const wardColors = {
  North: "#d6b46d",
  South: "#2f7dd1",
  East: "#2aa876",
  West: "#a65f5f",
};

export function MapView() {
  const { analytics, geographyMode, layerMode, opacity, selectedWard } = useVoterStore();
  const selectedWardMetric = analytics.wards.find((ward) => ward.ward === selectedWard);

  return (
    <section className="ovi-map-shell">
      <div className="ovi-map-toolbar">
        <div>
          <strong>Orange Township GIS View</strong>
          <span>{geographyMode} geography / {layerMode} layer</span>
        </div>
        <div className="ovi-map-actions">
          <button title="Zoom in">+</button>
          <button title="Zoom out">-</button>
          <button title="Search">⌕</button>
        </div>
      </div>
      <svg className="ovi-map" viewBox="0 0 500 460" role="img" aria-label="Aggregated voter analytics map of Orange Township wards and districts">
        <defs>
          <pattern id="street-grid" width="42" height="42" patternUnits="userSpaceOnUse" patternTransform="rotate(24)">
            <path d="M 42 0 L 0 0 0 42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
          </pattern>
        </defs>
        <rect width="500" height="460" fill="#e9edf2" />
        <rect width="500" height="460" fill="url(#street-grid)" />
        <path d="M38 88 C122 6 274 8 394 78 C490 132 476 322 350 415 C222 506 58 424 22 298 C-6 198 2 128 38 88Z" fill="#f8fafc" stroke="#8a98a8" strokeWidth="2" />
        {analytics.wards.map((metric) => {
          const fillOpacity = layerMode === "registered" ? Math.min(0.95, metric.registered / 4000) : opacityForRate(metric.turnout_rate);
          return (
            <g key={metric.ward}>
              <polygon
                points={wardPolygons[metric.ward as keyof typeof wardPolygons]}
                fill={wardColors[metric.ward as keyof typeof wardColors]}
                opacity={(fillOpacity * opacity) / 100}
                stroke={selectedWard === metric.ward ? "#04111f" : "#ffffff"}
                strokeWidth={selectedWard === metric.ward ? 5 : 2}
                onClick={() => setVoterState({ selectedWard: metric.ward })}
              />
            </g>
          );
        })}
        {geographyMode !== "ward" &&
          districtPoints.map((point) => {
            const district = analytics.districts.find((item) => item.district === point.id && item.ward === point.ward);
            const radius = Math.max(14, Math.min(42, (district?.voted || 90) / 10));
            return (
              <g key={`${point.ward}-${point.id}`}>
                <circle cx={point.x} cy={point.y} r={radius} fill="#04111f" opacity="0.18" />
                <circle cx={point.x} cy={point.y} r={radius * 0.68} fill="#d6b46d" opacity="0.86" />
                <text x={point.x} y={point.y + 5} textAnchor="middle" fontSize="15" fontWeight="800" fill="#06111d">{point.id}</text>
              </g>
            );
          })}
        {analytics.wards.map((metric, index) => (
          <text key={metric.id} x={[210, 198, 366, 88][index]} y={[122, 348, 238, 270][index]} textAnchor="middle" className="ovi-map-label">
            {metric.ward}
          </text>
        ))}
      </svg>
      <div className="ovi-map-inspector">
        <span>{selectedWardMetric ? selectedWardMetric.label : "All Wards"}</span>
        <strong>{selectedWardMetric ? `${selectedWardMetric.turnout_rate}% turnout` : `${analytics.turnout_rate}% township turnout`}</strong>
        <small>Privacy mode: aggregate counts only. No names, voter IDs, house numbers, phone numbers, or email fields are rendered.</small>
      </div>
    </section>
  );
}
