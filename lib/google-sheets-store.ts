// @ts-nocheck
import { createSign } from "node:crypto";
import { promises as fs } from "node:fs";

type ServiceAccountInfo = {
  client_email: string;
  private_key: string;
  token_uri?: string;
};

type SheetRow = Record<string, string>;

const DEFAULT_CONSTITUENT_SHEET = "Constituent Directory";
const DEFAULT_CASE_SHEET = "Constituent Case Log";
const DEFAULT_EVENT_SHEET = "Event Log";
const GOOGLE_SCOPE = "https://www.googleapis.com/auth/spreadsheets";

function base64Url(value: Buffer | string) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function normalizeHeader(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function parseServiceAccount(raw: string): ServiceAccountInfo | null {
  if (!raw.trim()) return null;
  try {
    return JSON.parse(raw) as ServiceAccountInfo;
  } catch {
    const decoded = Buffer.from(raw, "base64").toString("utf8");
    return JSON.parse(decoded) as ServiceAccountInfo;
  }
}

async function loadServiceAccount(): Promise<ServiceAccountInfo | null> {
  const jsonValue = process.env.WARDOS_GOOGLE_SERVICE_ACCOUNT_JSON?.trim() || "";
  if (jsonValue) return parseServiceAccount(jsonValue);

  const filePath = process.env.WARDOS_GOOGLE_SERVICE_ACCOUNT_FILE?.trim() || "";
  if (!filePath) return null;
  const raw = await fs.readFile(/* turbopackIgnore: true */ filePath, "utf8");
  return parseServiceAccount(raw);
}

function sheetId() {
  return process.env.WARDOS_MEMORY_SHEET_ID?.trim() || "";
}

function constituentSheetName() {
  return process.env.WARDOS_CONSTITUENT_SHEET_NAME?.trim() || DEFAULT_CONSTITUENT_SHEET;
}

function caseSheetName() {
  return process.env.WARDOS_CASES_SHEET_NAME?.trim() || DEFAULT_CASE_SHEET;
}

function eventSheetName() {
  return process.env.WARDOS_EVENTS_SHEET_NAME?.trim() || DEFAULT_EVENT_SHEET;
}

export function hasGoogleSheetStore() {
  return Boolean(sheetId());
}

export function hasGoogleSheetWriteStore() {
  return Boolean(sheetId() && (process.env.WARDOS_GOOGLE_SERVICE_ACCOUNT_JSON?.trim() || process.env.WARDOS_GOOGLE_SERVICE_ACCOUNT_FILE?.trim()));
}

async function googleAccessToken() {
  const account = await loadServiceAccount();
  if (!account?.client_email || !account.private_key) {
    throw new Error("WardOS Google Sheets credentials are not configured");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(
    JSON.stringify({
      iss: account.client_email,
      scope: GOOGLE_SCOPE,
      aud: account.token_uri || "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    }),
  );
  const unsigned = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign(account.private_key);
  const assertion = `${unsigned}.${base64Url(signature)}`;

  const response = await fetch(account.token_uri || "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Google token request failed: ${response.status} ${detail}`);
  }
  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("Google token response missing access_token");
  return data.access_token;
}

async function sheetsFetch(path: string, init?: RequestInit) {
  const token = await googleAccessToken();
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Google Sheets request failed: ${response.status} ${detail}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

async function ensureSheet(title: string) {
  const metadata = (await sheetsFetch("?fields=sheets.properties.title")) as { sheets?: Array<{ properties?: { title?: string } }> };
  const titles = new Set((metadata.sheets || []).map((sheet) => sheet.properties?.title || ""));
  if (titles.has(title)) return;
  await sheetsFetch(":batchUpdate", {
    method: "POST",
    body: JSON.stringify({ requests: [{ addSheet: { properties: { title } } }] }),
  });
}

async function readValues(title: string) {
  const range = encodeURIComponent(`${title}!A:ZZ`);
  try {
    const data = (await sheetsFetch(`/values/${range}`)) as { values?: string[][] };
    return data.values || [];
  } catch (error) {
    if (String(error).includes("Unable to parse range")) return [];
    throw error;
  }
}

async function writeValues(title: string, values: string[][]) {
  const range = encodeURIComponent(`${title}!A1`);
  await sheetsFetch(`/values/${range}?valueInputOption=USER_ENTERED`, {
    method: "PUT",
    body: JSON.stringify({ majorDimension: "ROWS", values }),
  });
}

async function appendValues(title: string, values: string[][]) {
  const range = encodeURIComponent(`${title}!A1`);
  await sheetsFetch(`/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
    method: "POST",
    body: JSON.stringify({ majorDimension: "ROWS", values }),
  });
}

export async function replaceSheetObjects(title: string, headers: string[], rows: Array<Record<string, unknown>>) {
  await ensureSheet(title);
  await sheetsFetch("/values:batchClear", {
    method: "POST",
    body: JSON.stringify({ ranges: [`${title}!A:ZZ`] }),
  });
  const values = [headers, ...rows.map((row) => headers.map((header) => String(row[header] ?? "")))];
  await writeValues(title, values);
}

async function readSheetObjects(title: string) {
  const values = await readValues(title);
  if (!values.length) return [] as SheetRow[];
  const headers = values[0].map(normalizeHeader);
  return values.slice(1).filter((row) => row.some((value) => String(value || "").trim())).map((row) => {
    const record: SheetRow = {};
    headers.forEach((header, index) => {
      if (!header) return;
      record[header] = String(row[index] || "");
    });
    return record;
  });
}

async function readPublicSheetObjects(title: string) {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId()}/gviz/tq?sheet=${encodeURIComponent(title)}&tqx=out:json`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Public Google Sheet request failed: ${response.status} ${detail}`);
  }

  const raw = await response.text();
  const prefix = "google.visualization.Query.setResponse(";
  const start = raw.indexOf(prefix);
  const end = raw.lastIndexOf(");");
  if (start === -1 || end === -1) {
    throw new Error("Could not parse public Google Sheet response");
  }

  const payload = JSON.parse(raw.slice(start + prefix.length, end)) as {
    status?: string;
    table?: {
      cols?: Array<{ label?: string }>;
      rows?: Array<{ c?: Array<{ v?: unknown; f?: string | null } | null> }>;
    };
  };

  const headers = (payload.table?.cols || []).map((col) => normalizeHeader(String(col.label || "")));
  const rows = payload.table?.rows || [];

  return rows
    .map((row) => {
      const record: SheetRow = {};
      headers.forEach((header, index) => {
        if (!header) return;
        const cell = row.c?.[index];
        const value = cell?.f ?? cell?.v ?? "";
        record[header] = String(value ?? "");
      });
      return record;
    })
    .filter((record) => Object.values(record).some((value) => String(value || "").trim()));
}

async function ensureHeader(title: string, headers: string[]) {
  await ensureSheet(title);
  const values = await readValues(title);
  if (!values.length) {
    await writeValues(title, [headers]);
    return;
  }
  const current = values[0].map(normalizeHeader);
  const expected = headers.map(normalizeHeader);
  if (JSON.stringify(current) !== JSON.stringify(expected)) {
    const body = [headers, ...values.slice(1)];
    await writeValues(title, body);
  }
}

export async function loadConstituentsFromSheet() {
  if (hasGoogleSheetWriteStore()) return readSheetObjects(constituentSheetName());
  return readPublicSheetObjects(constituentSheetName());
}

export async function loadCasesFromSheet() {
  if (hasGoogleSheetWriteStore()) return readSheetObjects(caseSheetName());
  return readPublicSheetObjects(caseSheetName());
}

export async function loadEventsFromSheet() {
  if (hasGoogleSheetWriteStore()) return readSheetObjects(eventSheetName());
  return readPublicSheetObjects(eventSheetName());
}

export async function appendCaseToSheet(row: Record<string, unknown>) {
  if (!hasGoogleSheetWriteStore()) throw new Error("WardOS Google Sheets write credentials are not configured");
  const headers = [
    "id",
    "created_at",
    "constituent_name",
    "address_line",
    "phone",
    "email",
    "topic",
    "status",
    "priority",
    "notes",
    "latitude",
    "longitude",
  ];
  await ensureHeader(caseSheetName(), headers);
  await appendValues(caseSheetName(), [
    headers.map((header) => String(row[header] ?? "")),
  ]);
}

export async function appendEventToSheet(row: Record<string, unknown>) {
  if (!hasGoogleSheetWriteStore()) throw new Error("WardOS Google Sheets write credentials are not configured");
  const headers = [
    "id",
    "created_at",
    "title",
    "starts_at",
    "location",
    "event_type",
    "status",
    "notes",
    "source_url",
    "source_id",
  ];
  await ensureHeader(eventSheetName(), headers);
  await appendValues(eventSheetName(), [
    headers.map((header) => String(row[header] ?? "")),
  ]);
}

export function summarizeConstituentRows(rows: SheetRow[]) {
  const byWard: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const bySubgroup: Record<string, number> = {};
  let received = 0;
  let outstanding = 0;

  rows.forEach((row) => {
    const ward = row.ward || "Unknown";
    const status = row.voter_status || "Unknown";
    const subgroup = row.subgroup || "Unspecified";
    byWard[ward] = (byWard[ward] || 0) + 1;
    byStatus[status] = (byStatus[status] || 0) + 1;
    bySubgroup[subgroup] = (bySubgroup[subgroup] || 0) + 1;
    if (status.toLowerCase() === "received") received += 1;
    else outstanding += 1;
  });

  return {
    total: rows.length,
    by_ward: byWard,
    by_status: byStatus,
    by_subgroup: bySubgroup,
    received,
    outstanding,
  };
}
