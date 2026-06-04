"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { setVoterState, useVoterStore } from "../store/useVoterStore";
import type { VoterMapPoint, WardName } from "../types/voter";

type LeafletMap = {
  setView: (center: [number, number], zoom: number) => LeafletMap;
  on: (event: string, handler: () => void) => LeafletMap;
  off: (event: string, handler: () => void) => LeafletMap;
  getZoom: () => number;
  remove: () => void;
};

type LeafletLayerGroup = {
  clearLayers: () => void;
  addTo: (map: LeafletMap) => LeafletLayerGroup;
};

type LeafletLayer = {
  addTo: (target: LeafletLayerGroup | LeafletMap) => LeafletLayer;
  bindTooltip?: (content: string, options?: Record<string, unknown>) => LeafletLayer;
};

type LeafletApi = {
  map: (element: HTMLElement, options?: Record<string, unknown>) => LeafletMap;
  tileLayer: (url: string, options?: Record<string, unknown>) => LeafletLayer;
  layerGroup: () => LeafletLayerGroup;
  circleMarker: (latlng: [number, number], options?: Record<string, unknown>) => LeafletLayer;
  marker: (latlng: [number, number], options?: Record<string, unknown>) => LeafletLayer;
  divIcon: (options?: Record<string, unknown>) => unknown;
};

declare global {
  interface Window {
    L?: LeafletApi;
  }
}

const wardColors: Record<Exclude<WardName, "Unknown">, string> = {
  North: "#d6b46d",
  South: "#2f7dd1",
  East: "#2aa876",
  West: "#a65f5f",
};

function colorForPoint(point: VoterMapPoint) {
  if (point.ballot_method === "Mail") return "#d6b46d";
  if (point.ballot_method === "Provisional") return "#a65f5f";
  if (point.party === "UNA") return "#2aa876";
  return wardColors[point.ward as Exclude<WardName, "Unknown">] || "#0a2a4a";
}

function clusterPoints(points: VoterMapPoint[], zoom: number, pointMode: "households" | "individuals") {
  const precision = zoom <= 12 ? 100 : zoom <= 13 ? 180 : 280;
  const clusters = new Map<string, { lat: number; lng: number; count: number; voted: number }>();

  points.forEach((point) => {
    const key = `${Math.round(point.lat * precision)}:${Math.round(point.lng * precision)}`;
    const weight = pointMode === "individuals" ? point.household_count || 1 : 1;
    const existing = clusters.get(key);
    if (existing) {
      existing.lat += point.lat * weight;
      existing.lng += point.lng * weight;
      existing.count += weight;
      existing.voted += point.voted ? 1 : 0;
    } else {
      clusters.set(key, { lat: point.lat * weight, lng: point.lng * weight, count: weight, voted: point.voted ? 1 : 0 });
    }
  });

  return [...clusters.values()].map((cluster) => ({
    ...cluster,
    lat: cluster.lat / cluster.count,
    lng: cluster.lng / cluster.count,
  }));
}

export function MapView() {
  const {
    analytics,
    geographyMode,
    layerMode,
    opacity,
    selectedWard,
    selectedDistrict,
    selectedParty,
    selectedAgeBand,
    selectedGender,
    pointMode,
    voterPoints,
  } = useVoterStore();
  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LeafletLayerGroup | null>(null);
  const [zoom, setZoom] = useState(12);

  const selectedWardMetric = analytics.wards.find((ward) => ward.ward === selectedWard);
  const filteredPoints = useMemo(
    () =>
      voterPoints.filter((point) => {
        if (selectedWard !== "All" && point.ward !== selectedWard) return false;
        if (selectedDistrict !== "All" && `${point.ward} ${point.district}` !== selectedDistrict) return false;
        if (selectedParty !== "All" && point.party !== selectedParty) return false;
        if (selectedAgeBand !== "All" && point.age_band !== selectedAgeBand) return false;
        if (selectedGender !== "All" && point.gender !== selectedGender) return false;
        return true;
      }),
    [selectedAgeBand, selectedDistrict, selectedGender, selectedParty, selectedWard, voterPoints],
  );
  const mapMode = zoom >= 14 ? "pins" : "heat bubbles";

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    function initialize() {
      if (cancelled || mapRef.current || !mapElement.current) return;
      const leaflet = window.L;
      if (!leaflet) {
        attempts += 1;
        if (attempts < 40) window.setTimeout(initialize, 100);
        return;
      }

      const map = leaflet.map(mapElement.current, {
        center: [40.7669, -74.2353],
        zoom: 12,
        minZoom: 11,
        maxZoom: 17,
        scrollWheelZoom: true,
      }).setView([40.7669, -74.2353], 12);
      leaflet
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        })
        .addTo(map);
      const layer = leaflet.layerGroup().addTo(map);
      const onZoom = () => setZoom(map.getZoom());
      map.on("zoomend", onZoom);
      mapRef.current = map;
      layerRef.current = layer;
      setZoom(map.getZoom());
    }

    initialize();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const leaflet = window.L;
    const layer = layerRef.current;
    if (!leaflet || !layer) return;

    layer.clearLayers();
    if (zoom >= 14) {
      filteredPoints.forEach((point) => {
        const copies = pointMode === "individuals" ? Math.max(1, point.household_count) : 1;
        for (let index = 0; index < copies; index += 1) {
          const angle = (index / copies) * Math.PI * 2;
          const distance = pointMode === "individuals" && copies > 1 ? 0.000035 + Math.min(0.00016, copies * 0.000006) : 0;
          const marker = leaflet.circleMarker([point.lat + Math.cos(angle) * distance, point.lng + Math.sin(angle) * distance], {
            radius: pointMode === "households" ? Math.max(5, Math.min(12, 4 + Math.sqrt(point.household_count))) : 4,
            stroke: true,
            color: "#ffffff",
            weight: 1,
            fillColor: colorForPoint(point),
            fillOpacity: Math.max(0.38, opacity / 100),
          });
          marker.bindTooltip?.(
            `${point.ward} Ward, District ${point.district}<br />${pointMode === "households" ? `${point.household_count} voter household marker` : "Individual voter mode"}<br />${point.geocoder_source} geocode, score ${point.match_score}`,
            {
            direction: "top",
            opacity: 0.92,
            },
          );
          marker.addTo(layer);
        }
      });
      return;
    }

    clusterPoints(filteredPoints, zoom, pointMode).forEach((cluster) => {
      const radius = Math.max(12, Math.min(48, 8 + Math.sqrt(cluster.count) * 2.6));
      const bubble = leaflet.circleMarker([cluster.lat, cluster.lng], {
        radius,
        stroke: true,
        color: "#ffffff",
        weight: 2,
        fillColor: "#d6b46d",
        fillOpacity: Math.max(0.25, opacity / 120),
      });
      bubble.bindTooltip?.(`${cluster.count.toLocaleString()} ${pointMode === "households" ? "households" : "voters"}`, { direction: "top", opacity: 0.92 });
      bubble.addTo(layer);
      leaflet
        .marker([cluster.lat, cluster.lng], {
          interactive: false,
          icon: leaflet.divIcon({
            className: "ovi-heat-label",
            html: `<span>${cluster.count}</span>`,
            iconSize: [44, 22],
            iconAnchor: [22, 11],
          }),
        })
        .addTo(layer);
    });
  }, [filteredPoints, opacity, pointMode, zoom]);

  return (
    <section className="ovi-map-shell">
      <div className="ovi-map-toolbar">
        <div>
          <strong>Orange Township Open Map</strong>
          <span>{geographyMode} geography / {layerMode} layer / {mapMode}</span>
        </div>
        <div className="ovi-map-actions">
          <button title="Household markers" onClick={() => setVoterState({ pointMode: "households" })} className={pointMode === "households" ? "active" : ""}>HH</button>
          <button title="Individual voter markers" onClick={() => setVoterState({ pointMode: "individuals" })} className={pointMode === "individuals" ? "active" : ""}>1:1</button>
          <button title="Show all wards" onClick={() => setVoterState({ selectedWard: "All", selectedDistrict: "All" })}>All</button>
          <button title="North Ward" onClick={() => setVoterState({ selectedWard: "North", selectedDistrict: "All" })}>N</button>
          <button title="South Ward" onClick={() => setVoterState({ selectedWard: "South", selectedDistrict: "All" })}>S</button>
          <button title="East Ward" onClick={() => setVoterState({ selectedWard: "East", selectedDistrict: "All" })}>E</button>
          <button title="West Ward" onClick={() => setVoterState({ selectedWard: "West", selectedDistrict: "All" })}>W</button>
        </div>
      </div>
      <div ref={mapElement} className="ovi-map ovi-leaflet-map" role="application" aria-label="OpenStreetMap voter point and heat bubble map" />
      <div className="ovi-map-inspector">
        <span>{selectedWardMetric ? selectedWardMetric.label : "All Wards"}</span>
        <strong>{filteredPoints.reduce((sum, point) => sum + (pointMode === "households" ? 1 : point.household_count), 0).toLocaleString()} {pointMode === "households" ? "household markers" : "voter points"}</strong>
        <small>Map plots stored lat/lon only. Geocoding happens in the upload pipeline, never during map interaction. Low-confidence and out-of-bound addresses are held for review.</small>
      </div>
    </section>
  );
}
