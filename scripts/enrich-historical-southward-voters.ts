// @ts-nocheck
import "dotenv/config";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { eq, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { readFile, utils } from "xlsx";
import { auditLogs, constituents } from "../db/schema";

const DEFAULT_XLSX_PATH = "../data/constituents/voter_file_2021_southward.xlsx";
const SOURCE_FILE = "Voter File 2021 - Southward.xlsx";
const SOURCE_YEAR = 2021;

function mode() {
  return process.argv.includes("--apply") ? "apply" : "dry_run";
}

function inputPath() {
  const index = process.argv.indexOf("--file");
  return resolve(index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : DEFAULT_XLSX_PATH);
}

function clean(value: unknown) {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "number" && Number.isInteger(value)) return String(value);
  return String(value).trim();
}

function titleClean(value: unknown) {
  return clean(value).toLowerCase().replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function dateOnly(value: unknown) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function digits(value: unknown) {
  return clean(value).replace(/\D/g, "");
}

function rowHash(row: Record<string, unknown>) {
  return createHash("sha256").update(JSON.stringify(row, Object.keys(row).sort())).digest("hex");
}

function fullName(row: Record<string, unknown>) {
  return [row["First Name"], row["Middle Name"], row["Last Name"], row.Suffix].map(titleClean).filter(Boolean).join(" ");
}

function firstLastName(row: Record<string, unknown>) {
  return [row["First Name"], row["Last Name"]].map(titleClean).filter(Boolean).join(" ");
}

function normalizeName(value: unknown) {
  return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function normalizeAddress(value: unknown) {
  const tokenMap = new Map(Object.entries({
    avenue: "ave",
    ave: "ave",
    road: "rd",
    rd: "rd",
    street: "st",
    st: "st",
    place: "pl",
    pl: "pl",
    court: "ct",
    ct: "ct",
    drive: "dr",
    dr: "dr",
    lane: "ln",
    ln: "ln",
    boulevard: "blvd",
    blvd: "blvd",
    north: "n",
    south: "s",
    east: "e",
    west: "w",
  }));
  const ignored = new Set(["apt", "apartment", "unit", "fl", "floor", "suite", "ste"]);
  return clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((token) => token && !ignored.has(token))
    .map((token) => tokenMap.get(token) || token)
    .join(" ")
    .trim();
}

function nameKeys(record: Record<string, unknown>) {
  const keys = [
    normalizeName(record.fullName || record.full_name),
    normalizeName([record.firstName || record.first_name, record.lastName || record.last_name].filter(Boolean).join(" ")),
  ].filter(Boolean);
  return [...new Set(keys)];
}

function currentAddressKey(row: Record<string, unknown>) {
  return normalizeAddress([row.streetNo, row.street, row.apt].filter(Boolean).join(" "));
}

function historicalAddressKey(row: Record<string, unknown>) {
  return normalizeAddress([row.streetAddress, row.apt].filter(Boolean).join(" "));
}

function profileKeys(record: Record<string, unknown>, addressKey: string) {
  if (!addressKey) return [];
  return nameKeys(record).map((nameKey) => `${nameKey}|${addressKey}`);
}

function readHistoricalRows(path: string) {
  const workbook = readFile(path, { cellDates: true });
  const rows = [];
  let skipped = 0;

  for (const sheetName of workbook.SheetNames) {
    const sheetRows = utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" }) as Array<Record<string, unknown>>;
    sheetRows.forEach((row, index) => {
      const voterId = clean(row.ID);
      if (!voterId || voterId.startsWith("MWD -") || voterId.startsWith("Section -")) {
        skipped += 1;
        return;
      }
      const streetAddress = clean(row["Street Address"] || row["Residence Address"] || row["Unnamed: 5"]);
      const apt = clean(row["APT/UNIT"] || row.APT || row["Apt/Unit"]);
      const record = {
        voterId,
        firstName: titleClean(row["First Name"]),
        lastName: titleClean(row["Last Name"]),
        fullName: fullName(row),
        firstLastName: firstLastName(row),
        streetAddress,
        apt,
        city: titleClean(row["Residence City"]),
        state: clean(row["Residence State"]).toUpperCase(),
        zipCode: clean(row["Residence Zip"]).padStart(5, "0"),
        ward: titleClean(row.Ward),
        votingDistrict: clean(row.District),
        dob: dateOnly(row.DOB),
        partyAffiliation: clean(row.Party).toUpperCase(),
        registrationDate: dateOnly(row["Reg Date"]),
        gender: titleClean(row.Gender),
        phone: digits(row["Phone #"] || row.Phone),
        sourceSheet: sheetName,
        sourceRowNumber: index + 2,
        sourceRowHash: rowHash(row),
      };
      if (!record.fullName || !historicalAddressKey(record)) {
        skipped += 1;
        return;
      }
      rows.push(record);
    });
  }

  return { rows, skipped, sheets: workbook.SheetNames };
}

function hasValue(value: unknown) {
  return value !== null && value !== undefined && clean(value) !== "";
}

function enrichmentUpdates(current: Record<string, unknown>, historical: Record<string, unknown>) {
  const updates: Record<string, unknown> = {};
  if (!hasValue(current.dob) && historical.dob) updates.dob = historical.dob;
  if (!hasValue(current.partyAffiliation) && historical.partyAffiliation) updates.partyAffiliation = historical.partyAffiliation;
  if (!hasValue(current.registrationDate) && historical.registrationDate) updates.registrationDate = historical.registrationDate;
  if (!hasValue(current.gender) && historical.gender) updates.gender = historical.gender;
  if (!hasValue(current.phone) && historical.phone) updates.phone = historical.phone;
  if (!hasValue(current.votingDistrict) && historical.votingDistrict) updates.votingDistrict = historical.votingDistrict;
  return updates;
}

function buildCurrentLookup(rows: Array<Record<string, unknown>>) {
  const lookup = new Map<string, Array<Record<string, unknown>>>();
  rows.forEach((row) => {
    profileKeys(row, currentAddressKey(row)).forEach((key) => {
      lookup.set(key, [...(lookup.get(key) || []), row]);
    });
  });
  return lookup;
}

function chooseCurrentMatch(candidates: Array<Record<string, unknown>>, historical: Record<string, unknown>) {
  if (candidates.length === 1) return candidates[0];
  const voterMatch = candidates.find((row) => clean(row.voterId) && clean(row.voterId) === historical.voterId);
  return voterMatch || null;
}

async function loadCurrentRows(db) {
  return db.select().from(constituents).where(isNull(constituents.deletedAt));
}

function postgresConnectionString() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) throw new Error("DATABASE_URL is required so the 2021 file can be matched against the current voter list.");
  return databaseUrl.replace(/^postgresql\+psycopg2:\/\//, "postgresql://");
}

async function main() {
  const filePath = inputPath();
  const { rows: historicalRows, skipped, sheets } = readHistoricalRows(filePath);
  const pool = new Pool({ connectionString: postgresConnectionString() });
  const db = drizzle(pool);
  try {
  const currentRows = await loadCurrentRows(db);
  const lookup = buildCurrentLookup(currentRows);
  const report = {
    mode: mode(),
    source_file: SOURCE_FILE,
    source_year: SOURCE_YEAR,
    sheets_found: sheets,
    current_rows_loaded: currentRows.length,
    historical_rows_found: historicalRows.length + skipped,
    historical_rows_usable: historicalRows.length,
    skipped_source_rows: skipped,
    matched_current_profiles: 0,
    updated_profiles: 0,
    already_enriched_profiles: 0,
    moved_or_not_current_profiles: 0,
    ambiguous_matches_skipped: 0,
    inserted_active_profiles: 0,
    fields_updated: {},
    moved_samples: [],
    ambiguous_samples: [],
  };

  for (const historical of historicalRows) {
    const candidates = profileKeys(historical, historicalAddressKey(historical)).flatMap((key) => lookup.get(key) || []);
    const uniqueCandidates = [...new Map(candidates.map((row) => [String(row.id), row])).values()];
    const current = chooseCurrentMatch(uniqueCandidates, historical);
    if (!current) {
      if (uniqueCandidates.length > 1) {
        report.ambiguous_matches_skipped += 1;
        if (report.ambiguous_samples.length < 10) report.ambiguous_samples.push({ name: historical.fullName, address: historical.streetAddress, district: historical.votingDistrict });
      } else {
        report.moved_or_not_current_profiles += 1;
        if (report.moved_samples.length < 10) report.moved_samples.push({ name: historical.fullName, address: historical.streetAddress, district: historical.votingDistrict });
      }
      continue;
    }

    report.matched_current_profiles += 1;
    const updates = enrichmentUpdates(current, historical);
    const updatedFields = Object.keys(updates);
    if (!updatedFields.length) {
      report.already_enriched_profiles += 1;
      continue;
    }

    updatedFields.forEach((field) => {
      report.fields_updated[field] = (report.fields_updated[field] || 0) + 1;
    });
    report.updated_profiles += 1;
    if (mode() === "apply") {
      await db.update(constituents).set({
        ...updates,
        historicalSourceFile: SOURCE_FILE,
        historicalSourceYear: SOURCE_YEAR,
        historicalMatchStatus: "matched_current",
        historicalPayload: {
          historical_voter_id: historical.voterId,
          source_sheet: historical.sourceSheet,
          source_row_number: historical.sourceRowNumber,
          source_row_hash: historical.sourceRowHash,
          source_address: historical.streetAddress,
          source_apt: historical.apt,
        },
        historicalEnrichedAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(constituents.id, current.id));
    }
  }

  if (mode() === "apply") {
    await db.insert(auditLogs).values({
      actor: "wardos_import",
      action: "enrich_historical_southward_voters",
      entityType: "constituents",
      entityId: SOURCE_FILE,
      detail: report,
      source: "script",
    });
  }

  console.log(JSON.stringify(report, null, 2));
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(JSON.stringify({
    status: "failed",
    error: error instanceof Error ? error.message : String(error),
    cause: error?.cause?.message || error?.cause?.code || "",
  }, null, 2));
  process.exit(1);
});
