import type { BallotMethod, ElectionRecord, PartyCode, WardName } from "../types/voter";

export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  const headers = rows[0]?.map((header) => header.trim()) || [];
  return rows.slice(1).map((cells) =>
    Object.fromEntries(headers.map((header, index) => [header, (cells[index] || "").trim()])),
  );
}

export function normalizeWard(value?: string): WardName {
  const normalized = (value || "").trim().toLowerCase();
  if (normalized.includes("north")) return "North";
  if (normalized.includes("south")) return "South";
  if (normalized.includes("east")) return "East";
  if (normalized.includes("west")) return "West";
  return "Unknown";
}

export function normalizeParty(value?: string): PartyCode {
  const normalized = (value || "").trim().toUpperCase();
  if (normalized === "DEM" || normalized.includes("DEMOCRAT")) return "DEM";
  if (normalized === "REP" || normalized.includes("REPUBLICAN")) return "REP";
  if (normalized === "UNA" || normalized.includes("UNAFFILIATED")) return "UNA";
  if (!normalized || normalized === "N/A" || normalized === "UNKNOWN") return "UNKNOWN";
  return "OTHER";
}

export function normalizeBallotMethod(value?: string, status?: string): BallotMethod {
  const normalized = (value || "").trim().toUpperCase();
  const ballotStatus = (status || "").trim().toUpperCase();
  if (ballotStatus === "R") return "Rejected";
  if (normalized === "M") return "Machine";
  if (normalized === "MB") return "Mail";
  if (normalized === "P") return "Provisional";
  if (normalized === "EV") return "Early";
  return "Unknown";
}

export function normalizeStreet(value?: string): string {
  const suffixes: Record<string, string> = {
    STREET: "ST",
    AVENUE: "AVE",
    ROAD: "RD",
    BOULEVARD: "BLVD",
    PLACE: "PL",
    DRIVE: "DR",
    COURT: "CT",
    LANE: "LN",
  };
  return (value || "")
    .toUpperCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => suffixes[part] || part)
    .join(" ");
}

export function processElectionCsv(text: string): ElectionRecord[] {
  return parseCsv(text)
    .filter((row) => row.ID && !row.ID.startsWith("Section"))
    .map((row, index) => ({
      source_record_id: `election-${index}`,
      voter_id: row.ID,
      election: row.Election || "May 12, 2026 Municipal Election",
      ballot_method: normalizeBallotMethod(row["Ballot Style"], row["Ballot Status"]),
      party_voted_in: normalizeParty(row["Party Voted In"]),
      voted: Number(row["# Voted"] || 0) > 0,
      ward: normalizeWard(row.Ward),
      district: row.District || "Unknown",
      street_name: normalizeStreet(row["Street Name"]),
      zip: row["Residence Zip"],
      voting_location: row["Voting Location"],
    }));
}
