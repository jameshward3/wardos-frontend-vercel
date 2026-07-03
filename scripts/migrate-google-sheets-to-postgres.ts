// @ts-nocheck
import "dotenv/config";
import { createHash, createSign } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { neon } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import {
  auditLogs,
  budgetWatchItems,
  constituentCases,
  constituents,
  developmentProjects,
  documentRecords,
  events,
  legislationItems,
  lookupValues,
  mediaMentions,
  officeActions,
  publicSafetyIncidents,
  sheetImportRuns,
  sheetSourceRows,
  sourceConnections,
  staffUsers,
  wardosMemoryItems,
} from "../db/schema";

const MEMORY_TABS = new Set([
  "Memory Index",
  "Constituents",
  "Constituent Needs",
  "Events",
  "Reports Documents",
  "Legislation",
  "Budget Watch",
  "Development",
  "Media Monitor",
  "Public Safety",
  "Office Actions",
  "Sources",
  "Staff",
]);

const DOMAIN_TABS_BY_CATEGORY: Record<string, string> = {
  reports_documents: "Reports Documents",
  legislation: "Legislation",
  budget_watch: "Budget Watch",
  development: "Development",
  media_monitor: "Media Monitor",
  public_safety: "Public Safety",
  office_actions: "Office Actions",
  sources: "Sources",
  staff: "Staff",
};

type SheetRow = {
  tabName: string;
  sheetId: number;
  rowNumber: number;
  raw: Record<string, string>;
  rowHash: string;
};

function argMode() {
  if (process.argv.includes("--apply")) return "apply";
  return "dry_run";
}

function normalizeHeader(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizedTabName(value: string) {
  return normalizeHeader(value);
}

function stableStringify(value: unknown) {
  return JSON.stringify(value, Object.keys(value as Record<string, unknown>).sort());
}

function hashRow(raw: Record<string, string>) {
  return createHash("sha256").update(stableStringify(raw)).digest("hex");
}

function base64Url(value: Buffer | string) {
  return Buffer.from(value).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function serviceAccount() {
  const email = process.env.GOOGLE_SHEETS_CLIENT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.trim()?.replace(/\\n/g, "\n");
  const json = process.env.WARDOS_GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (email && privateKey) return { client_email: email, private_key: privateKey, token_uri: "https://oauth2.googleapis.com/token" };
  if (json) {
    try {
      return JSON.parse(json);
    } catch {
      return JSON.parse(Buffer.from(json, "base64").toString("utf8"));
    }
  }
  const filePath = process.env.WARDOS_GOOGLE_SERVICE_ACCOUNT_FILE?.trim();
  if (filePath) {
    let resolved = filePath;
    if (filePath.startsWith("/app/data/")) resolved = join("..", "data", filePath.replace("/app/data/", ""));
    return JSON.parse(readFileSync(resolved, "utf8"));
  }
  throw new Error("Missing Google Sheets credentials. Set GOOGLE_SHEETS_CLIENT_EMAIL and GOOGLE_SHEETS_PRIVATE_KEY, or WARDOS_GOOGLE_SERVICE_ACCOUNT_JSON.");
}

async function googleAccessToken() {
  const account = serviceAccount();
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(JSON.stringify({
    iss: account.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
    aud: account.token_uri || "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const assertion = `${unsigned}.${base64Url(signer.sign(account.private_key))}`;
  const response = await fetch(account.token_uri || "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  if (!response.ok) throw new Error(`Google token request failed: ${response.status} ${await response.text()}`);
  return (await response.json()).access_token as string;
}

async function sheetsFetch(token: string, spreadsheetId: string, path: string) {
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Google Sheets request failed: ${response.status} ${await response.text()}`);
  return response.json();
}

async function readSpreadsheet(spreadsheetId: string) {
  const token = await googleAccessToken();
  const metadata = await sheetsFetch(token, spreadsheetId, "?fields=properties.title,sheets.properties(title,sheetId,gridProperties)");
  const tabs = [];
  for (const sheet of metadata.sheets || []) {
    const tabName = sheet.properties.title;
    const data = await sheetsFetch(token, spreadsheetId, `/values/${encodeURIComponent(`${tabName}!A:ZZ`)}?majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING`);
    const values = data.values || [];
    const headers = (values[0] || []).map(normalizeHeader);
    const rows: SheetRow[] = [];
    values.slice(1).forEach((valuesRow: string[], index: number) => {
      if (!valuesRow.some((cell) => String(cell ?? "").trim())) return;
      const raw: Record<string, string> = {};
      headers.forEach((header: string, headerIndex: number) => {
        if (header) raw[header] = String(valuesRow[headerIndex] ?? "").trim();
      });
      rows.push({ tabName, sheetId: sheet.properties.sheetId, rowNumber: index + 2, raw, rowHash: hashRow(raw) });
    });
    tabs.push({ title: tabName, sheetId: sheet.properties.sheetId, rowCount: rows.length, headers, rows });
  }
  return { spreadsheetId, title: metadata.properties?.title || "", tabs };
}

function parseDate(value: string) {
  const text = String(value || "").trim();
  if (!text) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateOnly(value: string) {
  const parsed = parseDate(value);
  return parsed ? parsed.toISOString().slice(0, 10) : null;
}

function intOrNull(value: string) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function numericOrNull(value: unknown) {
  const parsed = Number(String(value ?? ""));
  return Number.isFinite(parsed) ? String(parsed) : null;
}

function boolFrom(value: unknown, fallback = true) {
  if (typeof value === "boolean") return value;
  const text = String(value ?? "").toLowerCase();
  if (["false", "no", "0", "disabled", "inactive"].includes(text)) return false;
  if (["true", "yes", "1", "enabled", "active"].includes(text)) return true;
  return fallback;
}

function parsePayload(raw: Record<string, string>) {
  try {
    return raw.payload_json ? JSON.parse(raw.payload_json) : {};
  } catch {
    return {};
  }
}

function tags(raw: Record<string, string>) {
  return String(raw.tags || "").split(",").map((tag) => tag.trim()).filter(Boolean);
}

function memoryValues(row: SheetRow, spreadsheetId: string) {
  const raw = row.raw;
  return {
    memoryKey: raw.memory_key,
    category: raw.category,
    sourceTable: raw.source_table,
    sourceId: raw.source_id,
    title: raw.title || "Untitled",
    summary: raw.summary || "",
    status: raw.status || "",
    priority: raw.priority || "",
    owner: raw.owner || "",
    eventDate: parseDate(raw.event_date),
    url: raw.url || "",
    tags: tags(raw),
    payload: parsePayload(raw),
    sheetName: raw.sheet_name || row.tabName,
    sheetRowHash: raw.row_hash || row.rowHash,
    lastSeenAt: parseDate(raw.last_seen_at),
    sourceSpreadsheetId: spreadsheetId,
    sourceTabName: row.tabName,
    sourceRowNumber: row.rowNumber,
    sourceRowHash: row.rowHash,
    createdAt: parseDate(raw.created_at) || new Date(),
    updatedAt: parseDate(raw.updated_at) || new Date(),
  };
}

function constituentValues(row: SheetRow, spreadsheetId: string) {
  const raw = row.raw;
  return {
    legacyId: intOrNull(raw.id || raw.source_id),
    voterId: raw.voter_id || "",
    firstName: raw.first_name || "",
    lastName: raw.last_name || "",
    fullName: raw.full_name || raw.title || "",
    streetNo: raw.street_no || "",
    street: raw.street || raw.summary || "",
    apt: raw.apt || "",
    city: raw.city || "",
    state: raw.state || "",
    zipCode: raw.zip_code || "",
    ward: raw.ward || "",
    subgroup: raw.subgroup || raw.priority || "",
    voterStatus: raw.voter_status || raw.status || "",
    mailinRequestDate: dateOnly(raw.mailin_request_date),
    mailinSentDate: dateOnly(raw.mailin_sent_date),
    mailinReceivedDate: dateOnly(raw.mailin_received_date),
    daysToReturn: intOrNull(raw.days_to_return),
    sourceFile: raw.source_file || "",
    notes: raw.notes || "",
    sourceSpreadsheetId: spreadsheetId,
    sourceTabName: row.tabName,
    sourceRowNumber: row.rowNumber,
    sourceRowHash: row.rowHash,
    createdAt: parseDate(raw.created_at) || new Date(),
    updatedAt: parseDate(raw.updated_at) || new Date(),
  };
}

function caseValues(row: SheetRow, spreadsheetId: string) {
  const raw = row.raw;
  const payload = parsePayload(raw);
  return {
    legacyId: intOrNull(raw.id || raw.source_id),
    constituentName: raw.constituent_name || String(payload.constituent_name || ""),
    addressLine: raw.address_line || String(payload.address_line || ""),
    phone: raw.phone || String(payload.phone || ""),
    email: raw.email || String(payload.email || ""),
    topic: raw.topic || raw.title || "Constituent need",
    category: raw.category || "",
    department: raw.department || "",
    assignedTo: raw.assigned_to || "",
    ward: raw.ward || "",
    source: raw.source || "google_sheet",
    status: raw.status || "open",
    priority: raw.priority || "normal",
    notes: raw.notes || raw.summary || "",
    latitude: numericOrNull(raw.latitude || payload.latitude),
    longitude: numericOrNull(raw.longitude || payload.longitude),
    dueAt: parseDate(raw.due_at),
    resolvedAt: parseDate(raw.resolved_at),
    sourceSpreadsheetId: spreadsheetId,
    sourceTabName: row.tabName,
    sourceRowNumber: row.rowNumber,
    sourceRowHash: row.rowHash,
    createdAt: parseDate(raw.created_at || raw.event_date) || new Date(),
    updatedAt: new Date(),
  };
}

function eventValues(row: SheetRow, spreadsheetId: string) {
  const raw = row.raw;
  const payload = parsePayload(raw);
  return {
    legacyId: intOrNull(raw.id || raw.source_id),
    title: raw.title || "WardOS event",
    startsAt: parseDate(raw.starts_at || raw.event_date),
    location: raw.location || String(payload.location || ""),
    eventType: raw.event_type || String(payload.event_type || "event"),
    status: raw.status || "scheduled",
    notes: raw.notes || raw.summary || "",
    sourceUrl: raw.source_url || raw.url || "",
    sourceId: String(payload.source_id || raw.source_id || ""),
    sourceSpreadsheetId: spreadsheetId,
    sourceTabName: row.tabName,
    sourceRowNumber: row.rowNumber,
    sourceRowHash: row.rowHash,
    createdAt: parseDate(raw.created_at) || new Date(),
    updatedAt: parseDate(raw.updated_at) || new Date(),
  };
}

function domainValues(row: SheetRow, spreadsheetId: string, category: string) {
  const raw = row.raw;
  const payload = parsePayload(raw);
  const base = {
    legacyId: intOrNull(raw.source_id),
    payload,
    sourceSpreadsheetId: spreadsheetId,
    sourceTabName: row.tabName,
    sourceRowNumber: row.rowNumber,
    sourceRowHash: row.rowHash,
    createdAt: parseDate(raw.created_at) || new Date(),
    updatedAt: parseDate(raw.updated_at) || new Date(),
  };
  if (category === "development") return { ...base, name: raw.title || "Development project", address: String(payload.address || raw.summary || ""), projectType: String(payload.project_type || ""), status: raw.status || "tracking", board: String(payload.board || ""), latitude: numericOrNull(payload.latitude), longitude: numericOrNull(payload.longitude), notes: raw.summary || "", sourceUrl: raw.url || "", sourceId: raw.source_id || "" };
  if (category === "media_monitor") return { ...base, source: String(payload.source || ""), sourceType: String(payload.source_type || "news"), headline: raw.title || "Media mention", summary: raw.summary || "", url: raw.url || "", sentiment: raw.status || "neutral", topic: raw.priority || "", geographicTag: String(payload.geographic_tag || ""), engagementScore: intOrNull(String(payload.engagement_score || "")) || 0, latitude: numericOrNull(payload.latitude), longitude: numericOrNull(payload.longitude), publishedAt: parseDate(raw.event_date) };
  if (category === "public_safety") return { ...base, incidentType: String(payload.incident_type || "incident"), category: String(payload.category || "other"), title: raw.title || "Public safety incident", location: String(payload.location || ""), occurredAt: parseDate(raw.event_date), status: raw.status || "reported", severity: raw.priority || "medium", ward: String(payload.ward || "South Ward"), latitude: numericOrNull(payload.latitude), longitude: numericOrNull(payload.longitude), sourceFile: String(payload.source_file || ""), sourceUrl: raw.url || "", notes: raw.summary || "" };
  if (category === "office_actions") return { ...base, title: raw.title || "Office action", actionType: String(payload.action_type || "follow_up"), status: raw.status || "draft", priority: raw.priority || "normal", owner: raw.owner || "", dueAt: parseDate(raw.event_date), sourceType: String(payload.source_type || ""), sourceId: raw.source_id || "", notes: raw.summary || "" };
  if (category === "sources") return { ...base, name: raw.title || "Source", sourceType: tags(raw)[0] || "", url: raw.url || "", enabled: boolFrom(payload.enabled, true), lastSyncAt: parseDate(raw.event_date), status: raw.status || "not_configured", notes: raw.summary || "" };
  if (category === "staff") return { ...base, fullName: raw.title || "", email: raw.owner || String(payload.email || ""), role: raw.priority || "staff", title: String(payload.title || ""), isActive: String(raw.status || "").toLowerCase() !== "inactive", notes: raw.summary || "" };
  if (category === "legislation") return { ...base, billNumber: String(payload.bill_number || ""), title: raw.title || "Legislation", status: raw.status || "tracking", hearingDate: dateOnly(String(payload.hearing_date || raw.event_date || "")), sourceUrl: raw.url || "", sourceId: raw.source_id || "", notes: raw.summary || "" };
  if (category === "budget_watch") return { ...base, department: String(payload.department || ""), lineItem: String(payload.line_item || raw.title || ""), fiscalYear: String(payload.fiscal_year || ""), concern: raw.summary || "", status: raw.status || "watching" };
  if (category === "reports_documents") return { ...base, title: raw.title || "Document", folder: String(payload.folder || ""), fileName: String(payload.file_name || ""), docType: String(payload.doc_type || ""), status: raw.status || "new", notes: raw.summary || "" };
  return base;
}

function collectStats(spreadsheet: Awaited<ReturnType<typeof readSpreadsheet>>) {
  const tabsFound = spreadsheet.tabs.map((tab) => ({ title: tab.title, rows: tab.rowCount, headers: tab.headers }));
  const memoryRows = spreadsheet.tabs.find((tab) => tab.title === "Memory Index")?.rows || [];
  const categoryCounts: Record<string, number> = {};
  for (const row of memoryRows) categoryCounts[row.raw.category || "unknown"] = (categoryCounts[row.raw.category || "unknown"] || 0) + 1;
  const unmappedColumns = spreadsheet.tabs.flatMap((tab) =>
    tab.headers.filter(Boolean).map((header) => ({ tab: tab.title, column: header })).filter(({ tab, column }) => {
      if (MEMORY_TABS.has(tab)) return !["memory_key", "category", "source_table", "source_id", "title", "summary", "status", "priority", "owner", "event_date", "url", "tags", "payload_json", "sheet_name", "row_hash", "last_seen_at", "created_at", "updated_at", "age_days", "open_flag", "record_link", "needs_review"].includes(column);
      return false;
    }),
  );
  return {
    spreadsheet_id: spreadsheet.spreadsheetId,
    spreadsheet_title: spreadsheet.title,
    tabs_found: tabsFound,
    total_rows_found: spreadsheet.tabs.reduce((sum, tab) => sum + tab.rowCount, 0),
    canonical_memory_rows: memoryRows.length,
    category_counts: categoryCounts,
    unmapped_columns: unmappedColumns,
  };
}

function sqlIdentifier(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function excludedSet(table, sampleSet: Record<string, unknown>) {
  const set: Record<string, unknown> = {};
  for (const key of Object.keys(sampleSet)) {
    const columnName = table[key]?.name;
    if (!columnName) continue;
    set[key] = sql.raw(`excluded.${sqlIdentifier(columnName)}`);
  }
  return set;
}

async function upsertRows(db, table, rows: Record<string, unknown>[], conflictTarget, setValues: (row: Record<string, unknown>) => Record<string, unknown>, chunkSize = 500) {
  let imported = 0;
  for (let index = 0; index < rows.length; index += chunkSize) {
    const chunk = rows.slice(index, index + chunkSize);
    if (!chunk.length) continue;
    const updateSet = excludedSet(table, stripUndefined(setValues(chunk[0])));
    if (Object.keys(updateSet).length) {
      await db.insert(table).values(chunk).onConflictDoUpdate({ target: conflictTarget, set: updateSet });
    } else {
      await db.insert(table).values(chunk).onConflictDoNothing({ target: conflictTarget });
    }
    imported += chunk.length;
  }
  return imported;
}

async function insertRowsDoNothing(db, table, rows: Record<string, unknown>[], conflictTarget, chunkSize = 500) {
  let imported = 0;
  for (let index = 0; index < rows.length; index += chunkSize) {
    const chunk = rows.slice(index, index + chunkSize);
    if (!chunk.length) continue;
    await db.insert(table).values(chunk).onConflictDoNothing({ target: conflictTarget });
    imported += chunk.length;
  }
  return imported;
}

function stripUndefined(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined));
}

async function applyMigration(spreadsheet: Awaited<ReturnType<typeof readSpreadsheet>>, stats: ReturnType<typeof collectStats>) {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) throw new Error("DATABASE_URL is required for --apply");
  const db = drizzle(neon(databaseUrl));
  const [run] = await db.insert(sheetImportRuns).values({
    spreadsheetId: spreadsheet.spreadsheetId,
    mode: "apply",
    startedAt: new Date(),
    status: "running",
    tabsFound: stats.tabs_found,
    summary: {},
  }).returning();

  const summary = {
    ...stats,
    tables_mapped: [],
    total_rows_imported: 0,
    total_rows_skipped: 0,
    total_errors: 0,
    duplicate_records_detected: 0,
    errors: [] as Array<Record<string, unknown>>,
  };

  try {
    const allRows = spreadsheet.tabs.flatMap((tab) => tab.rows);
    const sourceRows = allRows.map((row) => ({
      importRunId: run.id,
      spreadsheetId: spreadsheet.spreadsheetId,
      tabName: row.tabName,
      sheetRowNumber: row.rowNumber,
      normalizedTabName: normalizedTabName(row.tabName),
      rowHash: row.rowHash,
      rawValues: row.raw,
      mappedTable: "",
      mappedRecordKey: row.raw.memory_key || row.raw.voter_id || row.raw.id || "",
      status: "seen",
      error: "",
    }));
    summary.total_rows_imported += await insertRowsDoNothing(db, sheetSourceRows, sourceRows, [sheetSourceRows.spreadsheetId, sheetSourceRows.tabName, sheetSourceRows.sheetRowNumber, sheetSourceRows.rowHash]);
    summary.tables_mapped.push("sheet_source_rows");

    const memoryTab = spreadsheet.tabs.find((tab) => tab.title === "Memory Index");
    const memoryRows = (memoryTab?.rows || []).filter((row) => row.raw.memory_key);
    summary.total_rows_imported += await upsertRows(db, wardosMemoryItems, memoryRows.map((row) => memoryValues(row, spreadsheet.spreadsheetId)), wardosMemoryItems.memoryKey, (row) => ({
      category: row.category,
      sourceTable: row.sourceTable,
      sourceId: row.sourceId,
      title: row.title,
      summary: row.summary,
      status: row.status,
      priority: row.priority,
      owner: row.owner,
      eventDate: row.eventDate,
      url: row.url,
      tags: row.tags,
      payload: row.payload,
      sheetName: row.sheetName,
      sheetRowHash: row.sheetRowHash,
      lastSeenAt: row.lastSeenAt,
      sourceTabName: row.sourceTabName,
      sourceRowNumber: row.sourceRowNumber,
      sourceRowHash: row.sourceRowHash,
      updatedAt: row.updatedAt,
      deletedAt: null,
    }));
    summary.tables_mapped.push("wardos_memory_items");

    const constituentTab = spreadsheet.tabs.find((tab) => tab.title === "Constituent Directory");
    const constituentRows = (constituentTab?.rows || []).map((row) => constituentValues(row, spreadsheet.spreadsheetId)).filter((row) => row.fullName && !/^grand totals$/i.test(row.voterId || row.fullName));
    summary.total_rows_skipped += (constituentTab?.rows.length || 0) - constituentRows.length;
    summary.total_rows_imported += await upsertRows(db, constituents, constituentRows, [constituents.sourceSpreadsheetId, constituents.sourceTabName, constituents.sourceRowNumber], (row) => ({
      voterId: row.voterId,
      firstName: row.firstName,
      lastName: row.lastName,
      fullName: row.fullName,
      streetNo: row.streetNo,
      street: row.street,
      apt: row.apt,
      city: row.city,
      state: row.state,
      zipCode: row.zipCode,
      ward: row.ward,
      subgroup: row.subgroup,
      voterStatus: row.voterStatus,
      mailinRequestDate: row.mailinRequestDate,
      mailinSentDate: row.mailinSentDate,
      mailinReceivedDate: row.mailinReceivedDate,
      daysToReturn: row.daysToReturn,
      sourceFile: row.sourceFile,
      notes: row.notes,
      sourceRowHash: row.sourceRowHash,
      updatedAt: row.updatedAt,
      deletedAt: null,
    }));
    summary.tables_mapped.push("constituents");

    const caseRows = [
      ...(spreadsheet.tabs.find((tab) => tab.title === "Constituent Case Log")?.rows || []),
      ...(spreadsheet.tabs.find((tab) => tab.title === "Constituent Needs")?.rows || []),
    ].map((row) => caseValues(row, spreadsheet.spreadsheetId)).filter((row) => row.constituentName || row.topic);
    summary.total_rows_imported += await upsertRows(db, constituentCases, caseRows, [constituentCases.sourceSpreadsheetId, constituentCases.sourceTabName, constituentCases.sourceRowNumber], (row) => ({ ...row, constituentId: undefined, id: undefined }));
    summary.tables_mapped.push("constituent_cases");

    const eventRows = (spreadsheet.tabs.find((tab) => tab.title === "Events")?.rows || []).map((row) => eventValues(row, spreadsheet.spreadsheetId)).filter((row) => row.title);
    summary.total_rows_imported += await upsertRows(db, events, eventRows, [events.sourceSpreadsheetId, events.sourceTabName, events.sourceRowNumber], (row) => ({ ...row, id: undefined }));
    summary.tables_mapped.push("events");

    const domainMappings = [
      ["development", developmentProjects, developmentProjects.sourceSpreadsheetId, developmentProjects.sourceTabName, developmentProjects.sourceRowNumber],
      ["media_monitor", mediaMentions, mediaMentions.sourceSpreadsheetId, mediaMentions.sourceTabName, mediaMentions.sourceRowNumber],
      ["public_safety", publicSafetyIncidents, publicSafetyIncidents.sourceSpreadsheetId, publicSafetyIncidents.sourceTabName, publicSafetyIncidents.sourceRowNumber],
      ["office_actions", officeActions, officeActions.sourceSpreadsheetId, officeActions.sourceTabName, officeActions.sourceRowNumber],
      ["sources", sourceConnections, sourceConnections.sourceSpreadsheetId, sourceConnections.sourceTabName, sourceConnections.sourceRowNumber],
      ["staff", staffUsers, staffUsers.sourceSpreadsheetId, staffUsers.sourceTabName, staffUsers.sourceRowNumber],
      ["legislation", legislationItems, legislationItems.sourceSpreadsheetId, legislationItems.sourceTabName, legislationItems.sourceRowNumber],
      ["budget_watch", budgetWatchItems, budgetWatchItems.sourceSpreadsheetId, budgetWatchItems.sourceTabName, budgetWatchItems.sourceRowNumber],
      ["reports_documents", documentRecords, documentRecords.sourceSpreadsheetId, documentRecords.sourceTabName, documentRecords.sourceRowNumber],
    ];
    for (const [category, table, a, b, c] of domainMappings) {
      const tab = spreadsheet.tabs.find((candidate) => candidate.title === DOMAIN_TABS_BY_CATEGORY[category]);
      const rows = (tab?.rows || []).map((row) => domainValues(row, spreadsheet.spreadsheetId, category)).filter(Boolean);
      if (!rows.length) continue;
      summary.total_rows_imported += await upsertRows(db, table, rows, [a, b, c], (row) => ({ ...row, id: undefined }));
      summary.tables_mapped.push(String(table[Symbol.for("drizzle:Name")] || category));
    }

    const lookupTab = spreadsheet.tabs.find((tab) => tab.title === "Lookups");
    const lookupRows = [];
    for (const row of lookupTab?.rows || []) {
      for (const [key, value] of Object.entries(row.raw)) {
        if (!value) continue;
        lookupRows.push({ lookupType: key, value, sortOrder: row.rowNumber, sourceSpreadsheetId: spreadsheet.spreadsheetId, sourceTabName: row.tabName, sourceRowNumber: row.rowNumber });
      }
    }
    if (lookupRows.length) {
      summary.total_rows_imported += await upsertRows(db, lookupValues, lookupRows, [lookupValues.lookupType, lookupValues.value], (row) => ({ sortOrder: row.sortOrder, sourceSpreadsheetId: row.sourceSpreadsheetId, sourceTabName: row.sourceTabName, sourceRowNumber: row.sourceRowNumber, updatedAt: new Date() }));
      summary.tables_mapped.push("lookup_values");
    }

    const auditTab = spreadsheet.tabs.find((tab) => tab.title === "Audit Log");
    const auditRows = (auditTab?.rows || []).map((row) => ({
      actor: row.raw.actor || "google_sheet",
      action: row.raw.action || "sync",
      entityType: row.raw.entity_type || "",
      entityId: row.raw.entity_id || "",
      detail: (() => { try { return row.raw.detail ? JSON.parse(row.raw.detail) : {}; } catch { return { raw_detail: row.raw.detail }; } })(),
      source: row.raw.source || "google_sheet",
      sourceSpreadsheetId: spreadsheet.spreadsheetId,
      sourceTabName: row.tabName,
      sourceRowNumber: row.rowNumber,
      createdAt: parseDate(row.raw.timestamp) || new Date(),
    }));
    if (auditRows.length) {
      await db.insert(auditLogs).values(auditRows);
      summary.total_rows_imported += auditRows.length;
      summary.tables_mapped.push("audit_logs");
    }

    await db.update(sheetImportRuns).set({ finishedAt: new Date(), status: "completed", summary }).where(sql`${sheetImportRuns.id} = ${run.id}`);
    return summary;
  } catch (error) {
    summary.total_errors += 1;
    summary.errors.push({ message: error instanceof Error ? error.message : String(error) });
    await db.update(sheetImportRuns).set({ finishedAt: new Date(), status: "failed", summary }).where(sql`${sheetImportRuns.id} = ${run.id}`);
    throw error;
  }
}

async function main() {
  const mode = argMode();
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || process.env.WARDOS_MEMORY_SHEET_ID || "1X6RwweEwqRSXII27hlmn8Qed8gSQuahaY40EA32XFE4";
  const spreadsheet = await readSpreadsheet(spreadsheetId);
  const stats = collectStats(spreadsheet);
  if (mode === "dry_run") {
    console.log(JSON.stringify({
      mode,
      ...stats,
      tables_created_or_mapped: ["sheet_source_rows", "wardos_memory_items", "constituents", "constituent_cases", "events", "development_projects", "media_mentions", "public_safety_incidents", "office_actions", "source_connections", "staff_users", "lookup_values", "audit_logs"],
      total_rows_imported: 0,
      total_rows_skipped: 0,
      total_errors: 0,
      duplicate_records_detected: 0,
    }, null, 2));
    return;
  }
  const summary = await applyMigration(spreadsheet, stats);
  console.log(JSON.stringify({ mode, ...summary }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ status: "failed", error: error instanceof Error ? error.message : String(error) }, null, 2));
  process.exit(1);
});
