import type { CanonicalVoterRecord, VoterMapPoint, WardName } from "../types/voter";

export const wardPolygons: Record<Exclude<WardName, "Unknown">, string> = {
  North: "122,38 270,26 344,116 302,210 166,204 84,132",
  East: "344,116 462,158 430,306 306,292 302,210",
  South: "166,204 306,292 284,420 130,430 54,316",
  West: "84,132 166,204 130,430 32,354 26,218",
};

export const districtPoints = [
  { id: "01", ward: "East" as WardName, x: 367, y: 180 },
  { id: "02", ward: "South" as WardName, x: 206, y: 318 },
  { id: "03", ward: "West" as WardName, x: 92, y: 282 },
  { id: "04", ward: "North" as WardName, x: 206, y: 118 },
  { id: "05", ward: "South" as WardName, x: 246, y: 374 },
  { id: "06", ward: "North" as WardName, x: 286, y: 92 },
];

export function opacityForRate(rate: number): number {
  return Math.max(0.18, Math.min(0.92, 0.2 + rate / 100));
}

const districtCenters: Record<string, { lat: number; lng: number }> = {
  "East-01": { lat: 40.7692, lng: -74.2218 },
  "East-02": { lat: 40.7668, lng: -74.2253 },
  "North-01": { lat: 40.7796, lng: -74.2374 },
  "North-04": { lat: 40.7771, lng: -74.2317 },
  "North-06": { lat: 40.7822, lng: -74.2299 },
  "South-02": { lat: 40.7555, lng: -74.2358 },
  "South-05": { lat: 40.7521, lng: -74.2443 },
  "West-03": { lat: 40.7641, lng: -74.2478 },
};

const wardCenters: Record<Exclude<WardName, "Unknown">, { lat: number; lng: number }> = {
  North: { lat: 40.779, lng: -74.235 },
  South: { lat: 40.754, lng: -74.241 },
  East: { lat: 40.766, lng: -74.223 },
  West: { lat: 40.763, lng: -74.249 },
};

function stableUnit(seed: string, salt: number): number {
  let hash = salt * 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 10000) / 10000;
}

function approximatePoint(record: CanonicalVoterRecord, index: number) {
  const districtCenter = districtCenters[`${record.ward}-${record.district}`];
  const wardCenter = record.ward !== "Unknown" ? wardCenters[record.ward] : undefined;
  const center = districtCenter || wardCenter || { lat: 40.7673, lng: -74.2353 };
  const seed = `${record.master_voter_id}-${record.ward}-${record.district}-${index}`;
  const angle = stableUnit(seed, 3) * Math.PI * 2;
  const distance = 0.00025 + stableUnit(seed, 7) * 0.0022;
  return {
    lat: center.lat + Math.cos(angle) * distance,
    lng: center.lng + Math.sin(angle) * distance,
  };
}

export function recordsToVoterMapPoints(records: CanonicalVoterRecord[]): VoterMapPoint[] {
  return records.map((record, index) => {
    const point = approximatePoint(record, index);
    return {
      id: record.master_voter_id,
      lat: point.lat,
      lng: point.lng,
      ward: record.ward,
      district: record.district,
      voted: record.voted,
      party: record.party,
      ballot_method: record.ballot_method,
    };
  });
}

export function demoVoterMapPoints(): VoterMapPoint[] {
  const mix = [
    { ward: "East" as WardName, district: "01", count: 493, party: "DEM" as const, ballot_method: "Machine" as const },
    { ward: "North" as WardName, district: "04", count: 337, party: "DEM" as const, ballot_method: "Machine" as const },
    { ward: "North" as WardName, district: "06", count: 87, party: "UNA" as const, ballot_method: "Mail" as const },
    { ward: "South" as WardName, district: "02", count: 526, party: "DEM" as const, ballot_method: "Mail" as const },
    { ward: "South" as WardName, district: "05", count: 307, party: "DEM" as const, ballot_method: "Machine" as const },
    { ward: "West" as WardName, district: "03", count: 255, party: "UNA" as const, ballot_method: "Machine" as const },
    { ward: "South" as WardName, district: "05", count: 21, party: "REP" as const, ballot_method: "Provisional" as const },
  ];

  const records: CanonicalVoterRecord[] = [];
  mix.forEach((group) => {
    for (let index = 0; index < group.count; index += 1) {
      records.push({
        master_voter_id: `demo-${group.ward}-${group.district}-${index}`,
        party: group.party,
        ward: group.ward,
        district: group.district,
        voted: true,
        ballot_method: group.ballot_method,
        election_count: 1,
        match_confidence: 0.74,
        needs_manual_review: false,
        gender: "Unknown",
        age_band: "Unknown",
      });
    }
  });

  return recordsToVoterMapPoints(records);
}
