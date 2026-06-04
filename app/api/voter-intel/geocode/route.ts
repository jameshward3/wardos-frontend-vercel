import { NextRequest, NextResponse } from "next/server";
import type { GeocodeResult, GeocoderSource, NormalizedAddress, WardName } from "../../../../src/types/voter";

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

function csvEscape(value: string | number): string {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += char;
    }
  }
  cells.push(cell.trim());
  return cells.map((value) => value.replace(/^"|"$/g, ""));
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

function resultFromCoordinates(address: NormalizedAddress, lat: number | undefined, lon: number | undefined, source: GeocoderSource, matchedAddress?: string, matchType = "Exact", matchScore = 100): GeocodeResult {
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

async function censusBatchGeocode(addresses: NormalizedAddress[]): Promise<Map<string, GeocodeResult>> {
  if (!addresses.length) return new Map();
  const form = new FormData();
  const lines = addresses.map((address, index) => [index, address.street, address.city, address.state, address.zip].map(csvEscape).join(","));
  form.append("addressFile", new Blob([lines.join("\n")], { type: "text/csv" }), "addresses.csv");
  form.append("benchmark", "Public_AR_Current");

  const response = await fetch("https://geocoding.geo.census.gov/geocoder/locations/addressbatch", {
    method: "POST",
    body: form,
  });
  if (!response.ok) throw new Error(`Census batch geocoder failed: ${response.status}`);
  const text = await response.text();
  const results = new Map<string, GeocodeResult>();
  text
    .split(/\r?\n/)
    .filter(Boolean)
    .forEach((line) => {
      const cells = parseCsvLine(line);
      const index = Number(cells[0]);
      const address = addresses[index];
      if (!address) return;
      const status = cells[2] || "";
      const matchedAddress = cells[3] || undefined;
      const lonLat = cells[5]?.split(/\s*,\s*/) || [];
      const lon = Number(lonLat[0]);
      const lat = Number(lonLat[1]);
      if (status.toLowerCase() === "match" && Number.isFinite(lat) && Number.isFinite(lon)) {
        results.set(address.normalized_key, resultFromCoordinates(address, lat, lon, "census", matchedAddress, cells[6] || "Match", 96));
      } else {
        results.set(address.normalized_key, unmatchedResult(address, "Unmatched by U.S. Census Geocoder"));
      }
    });
  return results;
}

async function mapboxFallback(address: NormalizedAddress): Promise<GeocodeResult | null> {
  const token = process.env.MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) return null;
  const query = encodeURIComponent(originalAddress(address));
  const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?country=US&limit=1&access_token=${token}`);
  if (!response.ok) return null;
  const data = await response.json();
  const feature = data?.features?.[0];
  const coordinates = feature?.center;
  if (!Array.isArray(coordinates)) return null;
  const relevance = typeof feature.relevance === "number" ? Math.round(feature.relevance * 100) : 80;
  return resultFromCoordinates(address, Number(coordinates[1]), Number(coordinates[0]), "mapbox", feature.place_name, feature.place_type?.[0] || "Fallback", relevance);
}

async function googleFallback(address: NormalizedAddress): Promise<GeocodeResult | null> {
  const key = process.env.GOOGLE_GEOCODING_KEY || process.env.NEXT_PUBLIC_GOOGLE_GEOCODING_KEY;
  if (!key) return null;
  const query = encodeURIComponent(originalAddress(address));
  const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${key}`);
  if (!response.ok) return null;
  const data = await response.json();
  const result = data?.results?.[0];
  const location = result?.geometry?.location;
  if (!location) return null;
  const partial = Boolean(result.partial_match);
  return resultFromCoordinates(address, Number(location.lat), Number(location.lng), "google", result.formatted_address, partial ? "Partial" : "Fallback", partial ? 78 : 90);
}

async function fallbackGeocode(address: NormalizedAddress): Promise<GeocodeResult | null> {
  const mapbox = await mapboxFallback(address);
  if (mapbox && !mapbox.needs_review) return mapbox;
  const google = await googleFallback(address);
  return google || mapbox;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const addresses = Array.isArray(body?.addresses) ? (body.addresses as NormalizedAddress[]).slice(0, 10000) : [];
  if (!addresses.length) return NextResponse.json({ results: [] });

  const results = new Map<string, GeocodeResult>();
  try {
    const censusResults = await censusBatchGeocode(addresses);
    addresses.forEach((address) => results.set(address.normalized_key, censusResults.get(address.normalized_key) || unmatchedResult(address)));
  } catch {
    addresses.forEach((address) => results.set(address.normalized_key, unmatchedResult(address, "Census batch geocoder unavailable")));
  }

  const fallbackTargets = [...results.values()].filter((result) => result.geocoder_source === "unmatched");
  for (const target of fallbackTargets) {
    const fallback = await fallbackGeocode(target.normalized_address);
    if (fallback) results.set(target.normalized_address.normalized_key, fallback);
  }

  return NextResponse.json({ results: [...results.values()] });
}
