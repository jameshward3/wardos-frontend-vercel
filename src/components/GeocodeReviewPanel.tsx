"use client";

import { useState } from "react";
import { geocodeNormalizedAddress } from "../lib/geocoding";
import { setVoterState, useVoterStore } from "../store/useVoterStore";
import type { GeocodeReviewItem, GeocodeResult, VoterMapPoint } from "../types/voter";

const orangeBounds = {
  minLat: 40.744,
  maxLat: 40.792,
  minLon: -74.262,
  maxLon: -74.214,
};

function pointFromReview(item: GeocodeReviewItem, result: GeocodeResult): VoterMapPoint | null {
  if (!result.lat || !result.lon || result.needs_review) return null;
  return {
    id: result.normalized_address.normalized_key,
    lat: result.lat,
    lng: result.lon,
    ward: result.ward,
    district: result.voting_district,
    census_block: result.census_block,
    census_tract: result.census_tract,
    parcel_id: result.parcel_id,
    voted: true,
    party: "UNKNOWN",
    age_band: "Unknown",
    gender: "Unknown",
    ballot_method: "Unknown",
    household_count: item.voter_count,
    geocoder_source: result.geocoder_source,
    match_score: result.match_score,
    needs_review: false,
  };
}

export function GeocodeReviewPanel() {
  const { geocodeReviewItems, voterPoints } = useVoterStore();
  const [expanded, setExpanded] = useState(false);
  const [manual, setManual] = useState<Record<string, { lat: string; lon: string }>>({});
  const [status, setStatus] = useState("");
  const visible = expanded ? geocodeReviewItems : geocodeReviewItems.slice(0, 6);

  function resolveItem(item: GeocodeReviewItem, result: GeocodeResult) {
    const point = pointFromReview(item, result);
    setVoterState({
      geocodeReviewItems: geocodeReviewItems.filter((candidate) => candidate.normalized_address.normalized_key !== item.normalized_address.normalized_key),
      voterPoints: point ? [...voterPoints.filter((candidate) => candidate.id !== point.id), point] : voterPoints,
    });
  }

  async function handleRegeocode(item: GeocodeReviewItem) {
    setStatus(`Re-geocoding ${item.normalized_address.street || "address"}`);
    const result = await geocodeNormalizedAddress(item.normalized_address);
    if (result.needs_review) {
      setStatus(result.review_reason || "Address still needs review");
      return;
    }
    resolveItem(item, result);
    setStatus("Address resolved and stored.");
  }

  function handleManual(item: GeocodeReviewItem) {
    const entry = manual[item.normalized_address.normalized_key];
    const lat = Number(entry?.lat);
    const lon = Number(entry?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      setStatus("Enter a valid latitude and longitude.");
      return;
    }
    if (lat < orangeBounds.minLat || lat > orangeBounds.maxLat || lon < orangeBounds.minLon || lon > orangeBounds.maxLon) {
      setStatus("Manual coordinates are outside expected Orange/Essex bounds.");
      return;
    }
    const result: GeocodeResult = {
      ...item,
      lat,
      lon,
      geocoder_source: "manual",
      match_score: 100,
      match_type: "Manual correction",
      matched_address: item.original_address,
      geocoded_at: new Date().toISOString(),
      needs_review: false,
      out_of_bounds: false,
      review_reason: undefined,
    };
    resolveItem(item, result);
    setStatus("Manual correction stored.");
  }

  return (
    <section className="ovi-panel">
      <div className="ovi-panel-head">
        <h2>Geocoding Review</h2>
        <span>{geocodeReviewItems.length.toLocaleString()} addresses need review</span>
      </div>
      <div className="ovi-review-note">
        Census batch geocoding is cached by normalized address. Mapbox or Google can be used as fallback for unmatched addresses once provider keys are configured.
        {status && <strong>{status}</strong>}
      </div>
      <div className="ovi-review-list">
        {visible.length ? (
          visible.map((item) => (
            <article key={item.normalized_address.normalized_key}>
              <div>
                <strong>{item.normalized_address.street || "Missing street"}</strong>
                <span>{[item.normalized_address.city, item.normalized_address.state, item.normalized_address.zip].filter(Boolean).join(", ")}</span>
              </div>
              <dl>
                <dt>Reason</dt><dd>{item.review_reason || "Needs manual review"}</dd>
                <dt>Source</dt><dd>{item.geocoder_source}</dd>
                <dt>Score</dt><dd>{item.match_score}</dd>
                <dt>Voters</dt><dd>{item.voter_count}</dd>
              </dl>
              <div className="ovi-review-actions">
                <input
                  placeholder="Lat"
                  value={manual[item.normalized_address.normalized_key]?.lat || ""}
                  onChange={(event) =>
                    setManual({
                      ...manual,
                      [item.normalized_address.normalized_key]: {
                        lat: event.target.value,
                        lon: manual[item.normalized_address.normalized_key]?.lon || "",
                      },
                    })
                  }
                />
                <input
                  placeholder="Lon"
                  value={manual[item.normalized_address.normalized_key]?.lon || ""}
                  onChange={(event) =>
                    setManual({
                      ...manual,
                      [item.normalized_address.normalized_key]: {
                        lat: manual[item.normalized_address.normalized_key]?.lat || "",
                        lon: event.target.value,
                      },
                    })
                  }
                />
                <button title="Store manual latitude and longitude" onClick={() => handleManual(item)}>Manual Correct</button>
                <button title="Run Census first, then fallback geocoder" onClick={() => void handleRegeocode(item)}>Re-geocode</button>
              </div>
            </article>
          ))
        ) : (
          <div className="ovi-empty-review">No low-confidence, unmatched, or out-of-bound geocodes in the current cached dataset.</div>
        )}
      </div>
      {geocodeReviewItems.length > 6 && (
        <button className="ovi-review-toggle" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Show Fewer" : `Show All ${geocodeReviewItems.length}`}
        </button>
      )}
    </section>
  );
}
