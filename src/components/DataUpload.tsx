"use client";

import { useState } from "react";
import { buildAnalytics } from "../lib/analytics";
import { processElectionCsv } from "../lib/electionProcessing";
import { mergeVoterDatasets } from "../lib/voterMerge";
import { setVoterState } from "../store/useVoterStore";
import type { DatasetKind } from "../types/voter";

export function DataUpload() {
  const [status, setStatus] = useState("Ready for CSV, XLSX, or GeoJSON imports");
  const [kind, setKind] = useState<DatasetKind>("election-history");

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setStatus(`Processing ${file.name}`);
    const text = await file.text();
    if (kind === "election-history" && file.name.toLowerCase().endsWith(".csv")) {
      const electionRecords = processElectionCsv(text);
      const deduped = mergeVoterDatasets(electionRecords);
      const analytics = buildAnalytics(
        deduped.records,
        deduped.report.exact_voter_id_duplicates + deduped.report.high_confidence_duplicates,
      );
      setVoterState({ analytics });
      setStatus(`Imported ${electionRecords.length.toLocaleString()} election records. Aggregates refreshed.`);
      return;
    }
    if (file.name.toLowerCase().endsWith(".geojson")) {
      setStatus("GeoJSON accepted. Boundary persistence hook is ready for PostGIS or ArcGIS sync.");
      return;
    }
    setStatus("File accepted for future XLSX/import pipeline. Current local parser supports election CSV and GeoJSON.");
  }

  return (
    <section className="ovi-panel">
      <div className="ovi-panel-head">
        <h2>Data Upload Center</h2>
        <span>Local IndexedDB persistence</span>
      </div>
      <div className="ovi-upload">
        <label>
          Dataset Type
          <select value={kind} onChange={(event) => setKind(event.target.value as DatasetKind)}>
            <option value="election-history">Election History</option>
            <option value="registered-voters">Master Registered Voter File</option>
            <option value="ward-geojson">Ward Boundary GeoJSON</option>
            <option value="district-geojson">District Boundary GeoJSON</option>
          </select>
        </label>
        <label
          className="ovi-dropzone"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            void handleFiles(event.dataTransfer.files);
          }}
        >
          <input type="file" accept=".csv,.xlsx,.geojson,.json" onChange={(event) => void handleFiles(event.target.files)} />
          <strong>Drop a voter file or boundary file</strong>
          <span>CSV, XLSX, and GeoJSON upload surface. Private fields stay client-side.</span>
        </label>
        <p>{status}</p>
      </div>
    </section>
  );
}
