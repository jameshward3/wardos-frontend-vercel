import type { CanonicalVoterRecord, GeocodeResult, GeocodeReviewItem, NormalizedAddress, VoterMapPoint, WardName } from "../types/voter";
import { recordsToVoterMapPoints } from "./geoProcessing";

const GEOCODE_DB = "orange-voter-geocoding";
const GEOCODE_STORE = "address-cache";

const orangeBounds = {
  minLat: 40.744,
  maxLat: 40.792,
  minLon: -74.262,
  maxLon: -74.214,
};

const districtBoxes: Array<{ ward: WardName; district: string; minLat: number; maxLat: number; minLon: number; maxLon: number }> = [
  { ward: "East", district: "01", minLat: 40.760, maxLat: 40.774, minLon: -74.229, maxLon: -74.215 },
  { ward: "North", district: "04", minLat: 40.771, maxLat: 40.781, minLon: -74.238, maxLon: -74.225 },
  { ward: "North", district: "06", minLat: 40.778, maxLat: 40.792, minLon: -74.238, maxLon: -74.222 },
  { ward: "South", district: "02", minLat: 40.750, maxLat: 40.762, minLon: -74.242, maxLon: -74.228 },
  { ward: "South", district: "05", minLat: 40.744, maxLat: 40.756, minLon: -74.253, maxLon: -74.235 },
  { ward: "West", district: "03", minLat: 40.756, maxLat: 40.771, minLon: -74.262, maxLon: -74.239 },
];

function openCache(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    const request = indexedDB.open(GEOCODE_DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(GEOCODE_STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

async function getCachedGeocode(key: string): Promise<GeocodeResult | null> {
  const db = await openCache();
  if (!db) return null;
  return new Promise((resolve) => {
    const tx = db.transaction(GEOCODE_STORE, "readonly");
    const request = tx.objectStore(GEOCODE_STORE).get(key);
    request.onsuccess = () => resolve((request.result as GeocodeResult) || null);
    request.onerror = () => resolve(null);
  });
}

async function setCachedGeocode(result: GeocodeResult): Promise<void> {
  const db = await openCache();
  if (!db) return;
  return new Promise((resolve) => {
    const tx = db.transaction(GEOCODE_STORE, "readwrite");
    tx.objectStore(GEOCODE_STORE).put(result, result.normalized_address.normalized_key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

function clean(value?: string): string {
  return (value || "").trim().replace(/\s+/g, " ");
}

export function normalizeAddress(record: CanonicalVoterRecord, sourceIsExplicitlyLocal = true): NormalizedAddress {
  const street = clean(`${record.street_number || ""} ${record.street_name || ""}`).toUpperCase();
  const city = clean(record.city) || (sourceIsExplicitlyLocal ? "Orange" : "");
  const state = clean(record.state) || (sourceIsExplicitlyLocal ? "NJ" : "");
  const zip = clean(record.zip);
  const country = "US";
  const normalized_key = [street, city.toUpperCase(), state.toUpperCase(), zip, country].filter(Boolean).join("|");
  return { street, city, state, zip, country, normalized_key };
}

function originalAddress(address: NormalizedAddress): string {
  return [address.street, address.city, address.state, address.zip].filter(Boolean).join(", ");
}

function validateOrangeBounds(lat?: number, lon?: number): boolean {
  if (typeof lat !== "number" || typeof lon !== "number") return false;
  return lat >= orangeBounds.minLat && lat <= orangeBounds.maxLat && lon >= orangeBounds.minLon && lon <= orangeBounds.maxLon;
}

function spatialJoin(lat?: number, lon?: number): { ward: WardName; district: string; census_tract?: string; census_block?: string } {
  if (typeof lat !== "number" || typeof lon !== "number") return { ward: "Unknown", district: "Unknown" };
  const district = districtBoxes.find((box) => lat >= box.minLat && lat <= box.maxLat && lon >= box.minLon && lon <= box.maxLon);
  return {
    ward: district?.ward || "Unknown",
    district: district?.district || "Unknown",
    census_tract: district ? `34013-${district.ward.toUpperCase().slice(0, 1)}${district.district}` : undefined,
    census_block: district ? `BLOCK-${district.ward.toUpperCase().slice(0, 1)}-${district.district}` : undefined,
  };
}

function reviewReason(result: GeocodeResult): string | undefined {
  if (!result.lat || !result.lon) return "Unmatched address";
  if (result.out_of_bounds) return "Outside Orange/Essex expected bounds";
  if (result.match_score < 85) return "Low-confidence or partial match";
  if (result.match_type.toLowerCase().includes("tie")) return "Ambiguous match";
  return undefined;
}

function resultFromCoordinates(address: NormalizedAddress, lat: number | undefined, lon: number | undefined, source: GeocodeResult["geocoder_source"], matchedAddress?: string, matchType = "Exact", matchScore = 100): GeocodeResult {
  const out_of_bounds = !validateOrangeBounds(lat, lon);
  const joined = spatialJoin(lat, lon);
  const result: GeocodeResult = {
    original_address: originalAddress(address),
    normalized_address: address,
    lat,
    lon,
    geocoder_source: source,
    match_score: matchScore,
    match_type: matchType,
    matched_address: matchedAddress,
    geocoded_at: new Date().toISOString(),
    needs_review: out_of_bounds || matchScore < 85 || !lat || !lon,
    out_of_bounds,
    ward: joined.ward,
    voting_district: joined.district,
    census_block: joined.census_block,
    census_tract: joined.census_tract,
  };
  result.review_reason = reviewReason(result);
  return result;
}

function unmatchedResult(address: NormalizedAddress, reason = "Unmatched by Census, fallback geocoder not configured"): GeocodeResult {
  const result = resultFromCoordinates(address, undefined, undefined, "unmatched", undefined, "Unmatched", 0);
  result.needs_review = true;
  result.review_reason = reason;
  return result;
}

export async function geocodeNormalizedAddress(address: NormalizedAddress): Promise<GeocodeResult> {
  const cached = await getCachedGeocode(address.normalized_key);
  if (cached && !cached.needs_review) return cached;
  const results = await serverBatchGeocode([address]);
  const result = results.get(address.normalized_key) || unmatchedResult(address);
  await setCachedGeocode(result);
  return result;
}

async function serverBatchGeocode(addresses: NormalizedAddress[]): Promise<Map<string, GeocodeResult>> {
  if (!addresses.length) return new Map();
  const response = await fetch("/api/voter-intel/geocode", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ addresses }),
  });
  if (!response.ok) throw new Error(`Geocoding proxy failed: ${response.status}`);
  const body = await response.json();
  const rows = Array.isArray(body?.results) ? (body.results as GeocodeResult[]) : [];
  return new Map(rows.map((row) => [row.normalized_address.normalized_key, row]));
}

function groupHouseholds(records: CanonicalVoterRecord[], geocodes: Map<string, GeocodeResult>, sourceIsExplicitlyLocal: boolean): VoterMapPoint[] {
  const households = new Map<string, { record: CanonicalVoterRecord; count: number; geocode: GeocodeResult }>();

  records.forEach((record) => {
    const address = normalizeAddress(record, sourceIsExplicitlyLocal);
    const geocode = geocodes.get(address.normalized_key);
    if (!geocode?.lat || !geocode.lon || geocode.needs_review) return;
    const existing = households.get(address.normalized_key);
    if (existing) {
      existing.count += 1;
    } else {
      households.set(address.normalized_key, { record, count: 1, geocode });
    }
  });

  return [...households.values()].map(({ record, count, geocode }) => ({
    id: geocode.normalized_address.normalized_key,
    lat: geocode.lat!,
    lng: geocode.lon!,
    ward: geocode.ward !== "Unknown" ? geocode.ward : record.ward,
    district: geocode.voting_district !== "Unknown" ? geocode.voting_district : record.district,
    census_block: geocode.census_block,
    census_tract: geocode.census_tract,
    parcel_id: geocode.parcel_id,
    voted: record.voted,
    party: record.party,
    age_band: record.age_band,
    gender: record.gender,
    ballot_method: record.ballot_method,
    household_count: count,
    geocoder_source: geocode.geocoder_source,
    match_score: geocode.match_score,
    needs_review: geocode.needs_review,
  }));
}

export async function geocodeVoterRecords(records: CanonicalVoterRecord[], sourceIsExplicitlyLocal = true): Promise<{
  points: VoterMapPoint[];
  reviewItems: GeocodeReviewItem[];
  geocodeResults: GeocodeResult[];
}> {
  const unique = new Map<string, NormalizedAddress>();
  records.forEach((record) => {
    const address = normalizeAddress(record, sourceIsExplicitlyLocal);
    if (address.street) unique.set(address.normalized_key, address);
  });

  const geocodes = new Map<string, GeocodeResult>();
  const uncached: NormalizedAddress[] = [];
  for (const address of unique.values()) {
    const cached = await getCachedGeocode(address.normalized_key);
    if (cached) geocodes.set(address.normalized_key, cached);
    else uncached.push(address);
  }

  for (let index = 0; index < uncached.length; index += 10000) {
    const batch = uncached.slice(index, index + 10000);
    try {
      const batchResults = await serverBatchGeocode(batch);
      batch.forEach((address) => geocodes.set(address.normalized_key, batchResults.get(address.normalized_key) || unmatchedResult(address)));
    } catch {
      batch.forEach((address) => geocodes.set(address.normalized_key, unmatchedResult(address, "Server geocoding proxy unavailable")));
    }
  }

  await Promise.all([...geocodes.values()].map(setCachedGeocode));
  const voterCountByAddress = new Map<string, number>();
  records.forEach((record) => {
    const key = normalizeAddress(record, sourceIsExplicitlyLocal).normalized_key;
    voterCountByAddress.set(key, (voterCountByAddress.get(key) || 0) + 1);
  });

  const reviewItems = [...geocodes.values()]
    .filter((result) => result.needs_review)
    .map((result) => ({ ...result, voter_count: voterCountByAddress.get(result.normalized_address.normalized_key) || 0 }));

  return {
    points: groupHouseholds(records, geocodes, sourceIsExplicitlyLocal),
    reviewItems,
    geocodeResults: [...geocodes.values()],
  };
}

export function buildSeededGeocoding(records: CanonicalVoterRecord[]) {
  const points = recordsToVoterMapPoints(records);
  return { points, reviewItems: [] as GeocodeReviewItem[], geocodeResults: [] as GeocodeResult[] };
}
