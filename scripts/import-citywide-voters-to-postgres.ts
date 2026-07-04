// @ts-nocheck
import "dotenv/config";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { neon } from "@neondatabase/serverless";
import { and, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { readFile, utils } from "xlsx";
import { auditLogs, constituents } from "../db/schema";

const DEFAULT_XLSX_PATH = "../data/constituents/orange_active_voters_citywide.xlsx";
const SOURCE_SPREADSHEET_ID = "citywide-active-voter-file";
const SOURCE_TAB_NAME = "ORANGE ACTIVE VOTERS";
const SOURCE_FILE = "orange_active_voters_citywide.xlsx";
const ACTIVE_SUBGROUP = "Orange Active Voters";
const SOUTH_WARD_SUBGROUP = "Orange Active Voters - South Ward";

function mode() {
  return process.argv.includes("--apply") ? "apply" : "dry_run";
}

function shouldReplaceActive() {
  return process.argv.includes("--replace-active");
}

function inputPath() {
  const index = process.argv.indexOf("--file");
  return resolve(index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : DEFAULT_XLSX_PATH);
}

function clean(value: unknown) {
  if (value == null) return "";
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

function fullName(row: Record<string, unknown>) {
  return [row["First Name"], row["Middle Name"], row["Last Name"], row.Suffix].map(titleClean).filter(Boolean).join(" ");
}

function statusLabel(value: unknown) {
  const raw = clean(value).toUpperCase();
  if (raw === "A") return "Active";
  if (raw === "I") return "Inactive";
  return titleClean(value) || "Unknown";
}

function wardLabel(value: unknown) {
  return titleClean(value) || "Unknown";
}

function rowHash(row: Record<string, unknown>) {
  return createHash("sha256").update(JSON.stringify(row, Object.keys(row).sort())).digest("hex");
}

function noteFor(row: Record<string, unknown>, ward: string) {
  const localNote = ward.toLowerCase() === "south"
    ? "Local South Ward constituent."
    : `Citywide registered voter outside local South Ward; ward marker: ${ward} Ward.`;
  return [
    localNote,
    `Party: ${clean(row.Party).toUpperCase() || "Unknown"}`,
    `District: ${clean(row.District) || "Unknown"}`,
    `DOB: ${dateOnly(row.DOB) || "Unknown"}`,
    `Registered: ${dateOnly(row["Reg Date"]) || "Unknown"}`,
    `Municipality: ${clean(row.Municipality) || "City of Orange Township"}`,
  ].join(" | ");
}

function readVoters(path: string) {
  const workbook = readFile(path, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const rows = utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" }) as Array<Record<string, unknown>>;
  const voters = [];
  let skipped = 0;
  for (const row of rows) {
    const voterId = clean(row.ID);
    if (!voterId || voterId.startsWith("Section -")) {
      skipped += 1;
      continue;
    }
    const ward = wardLabel(row.Ward);
    const zipCode = clean(row["Residence Zip"]);
    const sourceRowNumber = voters.length + skipped + 2;
    voters.push({
      voterId,
      firstName: titleClean(row["First Name"]),
      lastName: titleClean(row["Last Name"]),
      fullName: fullName(row),
      streetNo: clean(row["Street No."]),
      street: titleClean(row["Street Name"]),
      apt: clean(row["APT/UNIT"]),
      city: titleClean(row["Residence City"]),
      state: clean(row["Residence State"]).toUpperCase(),
      zipCode: /^\d+$/.test(zipCode) ? zipCode.padStart(5, "0") : zipCode,
      ward,
      subgroup: ward.toLowerCase() === "south" ? SOUTH_WARD_SUBGROUP : ACTIVE_SUBGROUP,
      voterStatus: statusLabel(row.Status),
      mailinRequestDate: null,
      mailinSentDate: null,
      mailinReceivedDate: null,
      daysToReturn: null,
      sourceFile: SOURCE_FILE,
      notes: noteFor(row, ward),
      sourceSpreadsheetId: SOURCE_SPREADSHEET_ID,
      sourceTabName: SOURCE_TAB_NAME,
      sourceRowNumber,
      sourceRowHash: rowHash(row),
      updatedAt: new Date(),
      deletedAt: null,
    });
  }
  return { voters, skipped };
}

function summary(voters: Array<Record<string, unknown>>, skipped: number) {
  const byWard: Record<string, number> = {};
  for (const voter of voters) byWard[String(voter.ward || "Unknown")] = (byWard[String(voter.ward || "Unknown")] || 0) + 1;
  return {
    source_file: SOURCE_FILE,
    total_rows_found: voters.length + skipped,
    total_voters_ready: voters.length,
    skipped_rows: skipped,
    by_ward: Object.fromEntries(Object.entries(byWard).sort()),
  };
}

async function upsertVoters(db, voters: Array<Record<string, unknown>>, chunkSize = 750) {
  let imported = 0;
  for (let index = 0; index < voters.length; index += chunkSize) {
    const chunk = voters.slice(index, index + chunkSize);
    await db.insert(constituents).values(chunk).onConflictDoUpdate({
      target: constituents.voterId,
      targetWhere: sql`${constituents.voterId} is not null and ${constituents.voterId} <> ''`,
      set: {
        firstName: sql.raw("excluded.first_name"),
        lastName: sql.raw("excluded.last_name"),
        fullName: sql.raw("excluded.full_name"),
        streetNo: sql.raw("excluded.street_no"),
        street: sql.raw("excluded.street"),
        apt: sql.raw("excluded.apt"),
        city: sql.raw("excluded.city"),
        state: sql.raw("excluded.state"),
        zipCode: sql.raw("excluded.zip_code"),
        ward: sql.raw("excluded.ward"),
        subgroup: sql.raw("excluded.subgroup"),
        voterStatus: sql.raw("excluded.voter_status"),
        mailinRequestDate: sql.raw("excluded.mailin_request_date"),
        mailinSentDate: sql.raw("excluded.mailin_sent_date"),
        mailinReceivedDate: sql.raw("excluded.mailin_received_date"),
        daysToReturn: sql.raw("excluded.days_to_return"),
        sourceFile: sql.raw("excluded.source_file"),
        notes: sql.raw("excluded.notes"),
        sourceSpreadsheetId: sql.raw("excluded.source_spreadsheet_id"),
        sourceTabName: sql.raw("excluded.source_tab_name"),
        sourceRowNumber: sql.raw("excluded.source_row_number"),
        sourceRowHash: sql.raw("excluded.source_row_hash"),
        updatedAt: new Date(),
        deletedAt: null,
      },
    });
    imported += chunk.length;
  }
  return imported;
}

async function softDeleteMailinRows(db) {
  const now = new Date();
  const result = await db.update(constituents).set({ deletedAt: now, updatedAt: now }).where(and(
    isNull(constituents.deletedAt),
    or(
      ilike(constituents.subgroup, "%mail%"),
      ilike(constituents.sourceFile, "%mail%"),
      ilike(constituents.notes, "%mail-in%"),
    ),
  )).returning({ id: constituents.id });
  return result.length;
}

async function main() {
  const path = inputPath();
  const { voters, skipped } = readVoters(path);
  const report = summary(voters, skipped);
  if (mode() === "dry_run") {
    console.log(JSON.stringify({ mode: "dry_run", replace_active: shouldReplaceActive(), ...report }, null, 2));
    return;
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) throw new Error("DATABASE_URL is required for --apply");
  const db = drizzle(neon(databaseUrl));
  const mailinRowsSoftDeleted = shouldReplaceActive() ? await softDeleteMailinRows(db) : 0;
  const imported = await upsertVoters(db, voters);
  await db.insert(auditLogs).values({
    actor: "wardos_import",
    action: "import_citywide_active_voters",
    entityType: "constituents",
    entityId: SOURCE_FILE,
    detail: { ...report, imported, mailin_rows_soft_deleted: mailinRowsSoftDeleted },
    source: "script",
  });
  console.log(JSON.stringify({ mode: "apply", replace_active: shouldReplaceActive(), ...report, imported, mailin_rows_soft_deleted: mailinRowsSoftDeleted, errors: 0 }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ status: "failed", error: error instanceof Error ? error.message : String(error) }, null, 2));
  process.exit(1);
});
