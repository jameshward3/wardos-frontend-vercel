// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import {
  appendCaseToSheet,
  appendEventToSheet,
  hasGoogleSheetStore,
  hasGoogleSheetWriteStore,
  loadCasesFromSheet,
  loadConstituentsFromSheet,
  loadEventsFromSheet,
  summarizeConstituentRows,
} from "../../../lib/google-sheets-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StoredRow = Record<string, unknown> & { id: number; created_at: string };

type Store = {
  nextId: number;
  cases: StoredRow[];
  legislation: StoredRow[];
  budgetWatch: StoredRow[];
  officeActions: StoredRow[];
  events: StoredRow[];
  mediaMentions: StoredRow[];
  publicSafetyIncidents: StoredRow[];
  sourceConnections: StoredRow[];
  staffUsers: StoredRow[];
};

const STORE_PATH = path.join("/tmp", "wardos-hosted-api-store.json");
const SEEDED_MEDIA_SOURCES = [
  {
    id: 1,
    name: "Orange NJ Real Talk",
    source_type: "facebook_group",
    url: "https://www.facebook.com/groups/OrangeNJRealTalk/",
    enabled: false,
    status: "needs_credentials",
    notes: JSON.stringify({ priority: "critical", category: "community", authentication_required: true }),
    created_at: "2026-06-03T00:00:00.000Z",
  },
  {
    id: 2,
    name: "Seven Oaks Society",
    source_type: "facebook_page",
    url: "https://www.facebook.com/sevenoakssociety/",
    enabled: false,
    status: "needs_credentials",
    notes: JSON.stringify({ priority: "high", category: "community", authentication_required: true }),
    created_at: "2026-06-03T00:00:00.000Z",
  },
  {
    id: 3,
    name: "Essex News Daily",
    source_type: "news",
    url: "https://essexnewsdaily.com/feed",
    enabled: true,
    status: "configured",
    notes: JSON.stringify({ priority: "critical", category: "orange,east_orange,essex_county", source_url: "https://essexnewsdaily.com" }),
    created_at: "2026-06-03T00:00:00.000Z",
  },
  {
    id: 4,
    name: "NJ.com",
    source_type: "news",
    url: "https://www.nj.com/",
    enabled: true,
    status: "configured",
    notes: JSON.stringify({ priority: "high", category: "new_jersey,essex_county,orange" }),
    created_at: "2026-06-03T00:00:00.000Z",
  },
  {
    id: 5,
    name: "NJ.com Essex County",
    source_type: "news",
    url: "https://www.nj.com/essex",
    enabled: true,
    status: "configured",
    notes: JSON.stringify({ priority: "critical", category: "essex_county" }),
    created_at: "2026-06-03T00:00:00.000Z",
  },
  {
    id: 6,
    name: "Essex Review",
    source_type: "news",
    url: "https://essexreview.com/",
    enabled: true,
    status: "configured",
    notes: JSON.stringify({ priority: "critical", category: "orange,essex_county" }),
    created_at: "2026-06-03T00:00:00.000Z",
  },
  {
    id: 7,
    name: "East Orange Record Transcript",
    source_type: "news",
    url: "https://essexnewsdaily.com/category/news/eastorange/feed",
    enabled: true,
    status: "configured",
    notes: JSON.stringify({ priority: "critical", category: "east_orange,orange,essex_county", source_url: "https://essexnewsdaily.com/category/news/eastorange/" }),
    created_at: "2026-06-06T00:00:00.000Z",
  },
  {
    id: 8,
    name: "Local Talk Weekly",
    source_type: "news",
    url: "https://localtalkweekly.com/index.php/category/essex/feed/",
    enabled: true,
    status: "configured",
    notes: JSON.stringify({ priority: "critical", category: "orange,city_of_orange_township,essex_county", source_url: "https://localtalkweekly.com/" }),
    created_at: "2026-06-07T00:00:00.000Z",
  },
];
const SEEDED_MEDIA_CONFIG = {
  local_news: [
    { name: "Essex News Daily", type: "news", priority: "critical", url: "https://essexnewsdaily.com/", rss: "https://essexnewsdaily.com/feed" },
    { name: "East Orange Record Transcript", type: "news", priority: "critical", url: "https://essexnewsdaily.com/category/news/eastorange/", rss: "https://essexnewsdaily.com/category/news/eastorange/feed" },
    { name: "Local Talk Weekly", type: "news", priority: "critical", url: "https://localtalkweekly.com/", rss: "https://localtalkweekly.com/index.php/category/essex/feed/" },
    { name: "Essex Review", type: "news", priority: "critical", url: "https://essexreview.com/" },
    { name: "NJ.com", type: "news", priority: "high", url: "https://www.nj.com/" },
    { name: "NJ.com Essex County", type: "news", priority: "critical", url: "https://www.nj.com/essex" },
  ],
  community: [
    { name: "Orange NJ Real Talk", type: "facebook_group", priority: "critical", url: "https://www.facebook.com/groups/OrangeNJRealTalk/", authentication_required: true },
    { name: "Seven Oaks Society", type: "facebook_page", priority: "high", url: "https://www.facebook.com/sevenoakssociety/", authentication_required: true },
  ],
  intelligence_topics: ["Taxes", "Budget", "Redevelopment", "PILOT Agreements", "Public Safety", "Traffic", "Trees", "Parking", "Development", "Schools"],
};
const HOSTED_WEATHER_CODES: Record<number, [string, string]> = {
  0: ["Sunny", "☀"],
  1: ["Mostly Sunny", "🌤"],
  2: ["Partly Cloudy", "⛅"],
  3: ["Cloudy", "☁"],
  45: ["Fog", "🌫"],
  48: ["Fog", "🌫"],
  51: ["Light Drizzle", "🌦"],
  53: ["Drizzle", "🌦"],
  55: ["Heavy Drizzle", "🌧"],
  61: ["Light Rain", "🌦"],
  63: ["Rain", "🌧"],
  65: ["Heavy Rain", "🌧"],
  71: ["Light Snow", "🌨"],
  73: ["Snow", "🌨"],
  75: ["Heavy Snow", "❄"],
  80: ["Rain Showers", "🌦"],
  81: ["Rain Showers", "🌧"],
  82: ["Heavy Showers", "⛈"],
  95: ["Thunderstorm", "⛈"],
  96: ["Thunderstorm", "⛈"],
  99: ["Thunderstorm", "⛈"],
};
const WEATHER_REFRESH_SECONDS = 3600;
const CASE_FIELDS = [
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
] as const;
const EVENT_FIELDS = [
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
] as const;

const CONSTITUENT_SUMMARY = {
  total: 638,
  by_status: { Received: 252, Outstanding: 386 },
  by_subgroup: { "May 2026 Mail-In Voters": 638 },
  by_ward: { South: 638 },
  mailin_may_2026: 638,
  received: 252,
  outstanding: 386,
  average_days_to_return: 29.6,
};

const SEEDED_STAFF_USERS = [
  {
    id: 1,
    full_name: "James Ward",
    email: "james@jameswardfororange.com",
    role: "admin",
    title: "Councilman",
    is_active: true,
    notes: "Primary WardOS administrator.",
    created_at: "2026-06-04T00:00:00.000Z",
  },
  {
    id: 2,
    full_name: "Jamar Young",
    email: "Manager@jameswardfororange.com",
    role: "strategy_advisor",
    title: "Strategy Advisor",
    is_active: true,
    notes: "Strategy advisor for office planning and follow-up coordination.",
    created_at: "2026-06-04T00:00:00.000Z",
  },
];

const SEEDED_MEETINGS = [
  {
    id: 148,
    title: "Zoning Board of Adjustment Meeting - June 09, 2026",
    starts_at: "2026-06-09T00:00:00",
    location: "Orange Zoning Board of Adjustment",
    status: "scheduled",
    event_type: "meeting",
  },
  {
    id: 171,
    title: "City of Orange Township - ABC Board Meeting",
    starts_at: "2026-06-11T18:00:00",
    location: "Virtual meeting",
    status: "posted",
    event_type: "meeting",
  },
  {
    id: 149,
    title: "Planning Board Meeting - June 17, 2026",
    starts_at: "2026-06-17T00:00:00",
    location: "Orange Planning Board",
    status: "scheduled",
    event_type: "meeting",
  },
  {
    id: 150,
    title: "Zoning Board of Adjustment Meeting - June 18, 2026",
    starts_at: "2026-06-18T00:00:00",
    location: "Orange Zoning Board of Adjustment",
    status: "scheduled",
    event_type: "meeting",
  },
];

const SEEDED_DEVELOPMENTS = [
  {
    id: 87,
    name: "ZBA Application JW26-001 - 434 Parkinson Terrace",
    address: "434 Parkinson Terrace",
    project_type: "application",
    status: "source posted",
    board: "Zoning Board of Adjustment",
    document_date: "2026-05-01",
    latitude: 40.779956092854,
    longitude: -74.229939638992,
    geocoder_source: "census",
    geocode_status: "matched",
    source_url: "https://orangetwpnjcc.org/wp-content/uploads/2026/05/ZBA-APP-JW26-001-434-Parkinson-Terrace-1-1.pdf",
  },
  {
    id: 86,
    name: "Public Notice",
    address: "391 Lakeside Avenue",
    project_type: "notice",
    status: "source posted",
    board: "Zoning Board of Adjustment",
    document_date: "2025-11-18",
    latitude: 40.78047265346,
    longitude: -74.227877631855,
    geocoder_source: "census",
    geocode_status: "matched",
    source_url: "https://orangetwpnjcc.org/wp-content/uploads/2025/11/11.18.2025-ZB-Public-Notice-rev.pdf",
  },
  {
    id: 83,
    name: "MW24-005 124-128 Ward St. App Survey Plans",
    address: "124-128 Ward Street",
    project_type: "redevelopment",
    status: "source posted",
    board: "Zoning Board of Adjustment",
    document_date: "2024-01-01",
    latitude: 40.771591287717,
    longitude: -74.223370118311,
    geocoder_source: "census",
    geocode_status: "range match",
    source_url: "https://acrobat.adobe.com/id/urn:aaid:sc:VA6C2:096654fd-cb7f-47b6-b726-2287be7a4ee2",
  },
  {
    id: 79,
    name: "220 N Center Street Application",
    address: "220 N Center Street",
    project_type: "application",
    status: "source posted",
    board: "Zoning Board of Adjustment",
    document_date: "2023-05-01",
    latitude: 40.766378716389,
    longitude: -74.231315592045,
    geocoder_source: "census",
    geocode_status: "review: census returned 220 S Center St",
    source_url: "https://orangetwpnjcc.org/wp-content/uploads/2023/05/220-N-Center-Street-Application_.pdf",
  },
  {
    id: 70,
    name: "47 Hillyer Street Public Notice",
    address: "47 Hillyer Street",
    project_type: "notice",
    status: "source posted",
    board: "Zoning Board of Adjustment",
    document_date: "2024-06-03",
    latitude: 40.770223439859,
    longitude: -74.222011983863,
    geocoder_source: "census",
    geocode_status: "matched",
    source_url: "https://orangetwpnjcc.org/wp-content/uploads/2024/05/6-3-2024-ZB-Public-Notice.pdf",
  },
];

const SEEDED_MEDIA_MENTIONS = [
  {
    id: 1,
    source: "Local Talk Weekly",
    source_type: "news",
    headline: "City of Orange Township items flagged for WardOS review",
    summary: "Orange-focused local coverage from Local Talk Weekly is highlighted for staff review, constituent context, and City of Orange Township follow-up.",
    url: "https://localtalkweekly.com/",
    sentiment: "neutral",
    topic: "City of Orange Township",
    geographic_tag: "Orange, NJ",
    engagement_score: 0,
    published_at: "2026-06-07T09:00:00",
    created_at: "2026-06-07T09:00:00",
  },
  {
    id: 2,
    source: "Essex Review",
    source_type: "news",
    headline: "Orange municipal coverage queued for Council review",
    summary: "Essex Review is treated as a primary Orange news source. WardOS should prioritize Orange, NJ and City of Orange Township stories over broader county items.",
    url: "https://essexreview.com/",
    sentiment: "neutral",
    topic: "Municipal Government",
    geographic_tag: "City of Orange Township",
    engagement_score: 0,
    published_at: "2026-06-07T08:30:00",
    created_at: "2026-06-07T08:30:00",
  },
  {
    id: 3,
    source: "Essex News Daily",
    source_type: "news",
    headline: "Orange and East Orange local news monitored for South Ward impact",
    summary: "WardOS highlights Orange-specific local news, East Orange Record Transcript coverage, and township items that may affect residents.",
    url: "https://essexnewsdaily.com/category/news/orange/",
    sentiment: "neutral",
    topic: "Community",
    geographic_tag: "Orange, NJ",
    engagement_score: 0,
    published_at: "2026-06-07T08:00:00",
    created_at: "2026-06-07T08:00:00",
  },
];

const SEEDED_PUBLIC_SAFETY_INCIDENTS = [
  {
    id: 501,
    incident_type: "Traffic",
    category: "traffic",
    category_label: "Traffic",
    title: "Traffic Collision",
    location: "Plymouth Rd & Schaefer Hwy",
    occurred_at: "2026-06-05T20:42:00-04:00",
    status: "reported",
    severity: "high",
    ward: "South Ward",
    latitude: 40.7564,
    longitude: -74.2426,
    source_file: "sample-police-monthly-briefing.pdf",
    source_url: "",
    notes: "Sample structure for OPD monthly briefing intake. Replace by uploading the current PDF to data/public_safety and running sync.",
    created_at: "2026-06-05T00:00:00.000Z",
  },
  {
    id: 502,
    incident_type: "Violent",
    category: "violent",
    category_label: "Violent",
    title: "Shooting Investigation",
    location: "Burt Rd & Joy Rd",
    occurred_at: "2026-06-05T19:31:00-04:00",
    status: "under review",
    severity: "high",
    ward: "South Ward",
    latitude: 40.7536,
    longitude: -74.2396,
    source_file: "sample-police-monthly-briefing.pdf",
    source_url: "",
    notes: "Staff review required before any external comment.",
    created_at: "2026-06-05T00:00:00.000Z",
  },
  {
    id: 503,
    incident_type: "Quality of Life",
    category: "quality_of_life",
    category_label: "Quality of Life",
    title: "Illegal Dumping",
    location: "Outer Dr W & Thatcher Ave",
    occurred_at: "2026-06-05T18:22:00-04:00",
    status: "reported",
    severity: "medium",
    ward: "South Ward",
    latitude: 40.7518,
    longitude: -74.2464,
    source_file: "sample-police-monthly-briefing.pdf",
    source_url: "",
    notes: "Coordinate sanitation, code enforcement, and outreach follow-up.",
    created_at: "2026-06-05T00:00:00.000Z",
  },
  {
    id: 504,
    incident_type: "Infrastructure",
    category: "infrastructure",
    category_label: "Infrastructure",
    title: "Street Light Outage",
    location: "Westwood St & Park Ave",
    occurred_at: "2026-06-05T17:18:00-04:00",
    status: "reported",
    severity: "low",
    ward: "South Ward",
    latitude: 40.7582,
    longitude: -74.2479,
    source_file: "sample-police-monthly-briefing.pdf",
    source_url: "",
    notes: "Check if related constituent cases already exist.",
    created_at: "2026-06-05T00:00:00.000Z",
  },
  {
    id: 505,
    incident_type: "Infrastructure",
    category: "infrastructure",
    category_label: "Infrastructure",
    title: "Fallen Tree",
    location: "Scotland Rd near Park Ave",
    occurred_at: "2026-06-05T16:05:00-04:00",
    status: "resolved",
    severity: "low",
    ward: "South Ward",
    latitude: 40.7548,
    longitude: -74.251,
    source_file: "sample-police-monthly-briefing.pdf",
    source_url: "",
    notes: "Mark resolved after DPW confirmation.",
    created_at: "2026-06-05T00:00:00.000Z",
  },
];

const GITHUB_SOURCES = {
  budget: {
    label: "Orange Budget Dashboard",
    repo: "jameshward3/OrangeBudgetDashboard",
    path: "historical_budget_dataset.json",
    raw_url: "https://raw.githubusercontent.com/jameshward3/OrangeBudgetDashboard/main/historical_budget_dataset.json",
  },
  progress: {
    label: "Personal Progress",
    repo: "jameshward3/Progress",
    path: "metrics.json",
    raw_url: "https://raw.githubusercontent.com/jameshward3/Progress/main/metrics.json",
  },
  legislation: {
    label: "Legislative Tracker",
    repo: "jameshward3/Legislative_tracker",
    path: "metrics.json",
    raw_url: "https://raw.githubusercontent.com/jameshward3/Legislative_tracker/main/metrics.json",
  },
};

function emptyStore(): Store {
  return {
    nextId: 1,
    cases: [],
    legislation: [],
    budgetWatch: [],
    officeActions: [],
    events: [],
    mediaMentions: [],
    publicSafetyIncidents: [],
    sourceConnections: [],
    staffUsers: [],
  };
}

async function fetchGithubSource(name: keyof typeof GITHUB_SOURCES) {
  const source = GITHUB_SOURCES[name];
  try {
    const response = await fetch(source.raw_url, {
      headers: { Accept: "application/vnd.github.raw+json", "User-Agent": "WardOS" },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
    return { ok: true, from_cache: false, fetched_at: new Date().toISOString(), source, data: await response.json() };
  } catch (error) {
    return { ok: false, from_cache: false, fetched_at: new Date().toISOString(), source, error: error instanceof Error ? error.message : String(error), data: null };
  }
}

function normalizeBudget(envelope: Record<string, unknown>) {
  const rows = Array.isArray(envelope.data) ? [...envelope.data] as Array<Record<string, number | string>> : [];
  rows.sort((a, b) => Number(a.year || 0) - Number(b.year || 0));
  const latest = rows[rows.length - 1] || {};
  const previous = rows[rows.length - 2] || {};
  const growth = (key: string) => {
    const current = Number(latest[key] || 0);
    const prior = Number(previous[key] || 0);
    return prior ? Math.round(((current - prior) / prior) * 10000) / 100 : null;
  };
  return {
    ...envelope,
    summary: {
      latest_year: latest.year || null,
      total_budget: latest.totalBudget || null,
      tax_levy: latest.taxLevy || null,
      non_tax_revenue: latest.nonTaxRevenue || null,
      surplus: latest.surplus || null,
      debt_service: latest.debtService || null,
      budget_growth_percent: growth("totalBudget"),
      tax_levy_growth_percent: growth("taxLevy"),
      years_tracked: rows.length,
    },
    rows,
  };
}

function normalizeProgress(envelope: Record<string, unknown>) {
  const data = (envelope.data || {}) as { summary?: Record<string, unknown>; commitments?: Array<Record<string, unknown>> };
  const items = Array.isArray(data.commitments) ? data.commitments : [];
  const progressValues = items.map((item) => Number(item.progress || 0)).filter((value) => Number.isFinite(value));
  const average = progressValues.length ? Math.round((progressValues.reduce((sum, value) => sum + value, 0) / progressValues.length) * 10) / 10 : 0;
  return {
    ...envelope,
    summary: {
      ...(data.summary || {}),
      average_progress: average,
      items_tracked: items.length,
      in_progress: items.filter((item) => String(item.status || "").toLowerCase() === "in progress").length,
      completed: items.filter((item) => String(item.status || "").toLowerCase() === "completed").length,
    },
    items,
  };
}

function normalizeLegislation(envelope: Record<string, unknown>) {
  const data = (envelope.data || {}) as { summary?: Record<string, unknown>; items?: Array<Record<string, unknown>>; legislation?: Array<Record<string, unknown>>; commitments?: Array<Record<string, unknown>> };
  if (Array.isArray(data.commitments) && String(data.summary?.title || "").toLowerCase().includes("first 100 days")) {
    return {
      ...envelope,
      ok: false,
      data_quality: "Legislative_tracker currently contains progress metrics, not legislation records.",
      summary: { title: "Legislative Tracker", items_tracked: 0, in_progress: 0, completed: 0 },
      items: [],
    };
  }
  const items = Array.isArray(data.items) ? data.items : Array.isArray(data.legislation) ? data.legislation : [];
  return {
    ...envelope,
    summary: { ...(data.summary || {}), items_tracked: items.length },
    items,
  };
}

async function readStore(): Promise<Store> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    return { ...emptyStore(), ...JSON.parse(raw) };
  } catch {
    return emptyStore();
  }
}

async function writeStore(store: Store) {
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function casesToCsv(rows: StoredRow[], includeBom = false) {
  const csv = [
    CASE_FIELDS.join(","),
    ...rows.map((row) => CASE_FIELDS.map((field) => csvEscape(row[field])).join(",")),
  ].join("\n");
  return includeBom ? `\uFEFF${csv}` : csv;
}

function eventsToCsv(rows: StoredRow[], includeBom = false) {
  const csv = [
    EVENT_FIELDS.join(","),
    ...rows.map((row) => EVENT_FIELDS.map((field) => csvEscape(row[field])).join(",")),
  ].join("\n");
  return includeBom ? `\uFEFF${csv}` : csv;
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

function csvToCases(csv: string): StoredRow[] {
  const lines = csv.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0].replace(/^\uFEFF/, ""));
  return lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line);
    const row: Record<string, unknown> = {};
    headers.forEach((header, headerIndex) => {
      row[header] = values[headerIndex] || "";
    });
    const id = Number(row.id) || index + 1;
    return { ...row, id, created_at: String(row.created_at || "") };
  });
}

function csvToEvents(csv: string): StoredRow[] {
  const lines = csv.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0].replace(/^\uFEFF/, ""));
  return lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line);
    const row: Record<string, unknown> = {};
    headers.forEach((header, headerIndex) => {
      row[header] = values[headerIndex] || "";
    });
    const id = Number(row.id) || index + 1;
    return { ...row, id, created_at: String(row.created_at || "") };
  });
}

function githubCaseStorageConfig() {
  const repo = process.env.WARDOS_CASE_LOG_REPO?.trim();
  const token = process.env.WARDOS_CASE_LOG_TOKEN?.trim() || process.env.GITHUB_TOKEN?.trim();
  const branch = process.env.WARDOS_CASE_LOG_BRANCH?.trim() || "main";
  const filePath = process.env.WARDOS_CASE_LOG_PATH?.trim() || "data/constituent_cases.csv";
  if (!repo || !token) return null;
  return { repo, token, branch, filePath };
}

function githubEventStorageConfig() {
  const repo = process.env.WARDOS_EVENT_LOG_REPO?.trim() || process.env.WARDOS_CASE_LOG_REPO?.trim();
  const token = process.env.WARDOS_EVENT_LOG_TOKEN?.trim() || process.env.WARDOS_CASE_LOG_TOKEN?.trim() || process.env.GITHUB_TOKEN?.trim();
  const branch = process.env.WARDOS_EVENT_LOG_BRANCH?.trim() || process.env.WARDOS_CASE_LOG_BRANCH?.trim() || "main";
  const filePath = process.env.WARDOS_EVENT_LOG_PATH?.trim() || "data/events.csv";
  if (!repo || !token) return null;
  return { repo, token, branch, filePath };
}

async function readGithubCases(): Promise<{ rows: StoredRow[]; sha?: string } | null> {
  const config = githubCaseStorageConfig();
  if (!config) return null;
  const url = `https://api.github.com/repos/${config.repo}/contents/${encodeURIComponent(config.filePath).replace(/%2F/g, "/")}?ref=${encodeURIComponent(config.branch)}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "WardOS",
    },
    cache: "no-store",
  });
  if (response.status === 404) return { rows: [] };
  if (!response.ok) throw new Error(`GitHub case log read failed: ${response.status}`);
  const data = (await response.json()) as { content?: string; sha?: string };
  const content = Buffer.from(String(data.content || ""), "base64").toString("utf8");
  return { rows: csvToCases(content), sha: data.sha };
}

async function readGithubEvents(): Promise<{ rows: StoredRow[]; sha?: string } | null> {
  const config = githubEventStorageConfig();
  if (!config) return null;
  const url = `https://api.github.com/repos/${config.repo}/contents/${encodeURIComponent(config.filePath).replace(/%2F/g, "/")}?ref=${encodeURIComponent(config.branch)}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "WardOS",
    },
    cache: "no-store",
  });
  if (response.status === 404) return { rows: [] };
  if (!response.ok) throw new Error(`GitHub event log read failed: ${response.status}`);
  const data = (await response.json()) as { content?: string; sha?: string };
  const content = Buffer.from(String(data.content || ""), "base64").toString("utf8");
  return { rows: csvToEvents(content), sha: data.sha };
}

async function writeGithubCases(rows: StoredRow[], sha?: string) {
  const config = githubCaseStorageConfig();
  if (!config) return false;
  const url = `https://api.github.com/repos/${config.repo}/contents/${encodeURIComponent(config.filePath).replace(/%2F/g, "/")}`;
  const body: Record<string, unknown> = {
    message: "Update WardOS constituent case log",
    content: Buffer.from(casesToCsv(rows), "utf8").toString("base64"),
    branch: config.branch,
  };
  if (sha) body.sha = sha;
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "WardOS",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`GitHub case log write failed: ${response.status}`);
  return true;
}

async function writeGithubEvents(rows: StoredRow[], sha?: string) {
  const config = githubEventStorageConfig();
  if (!config) return false;
  const url = `https://api.github.com/repos/${config.repo}/contents/${encodeURIComponent(config.filePath).replace(/%2F/g, "/")}`;
  const body: Record<string, unknown> = {
    message: "Update WardOS event log",
    content: Buffer.from(eventsToCsv(rows), "utf8").toString("base64"),
    branch: config.branch,
  };
  if (sha) body.sha = sha;
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "WardOS",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`GitHub event log write failed: ${response.status}`);
  return true;
}

async function loadCases(store: Store) {
  if (hasGoogleSheetStore()) {
    const rows = await loadCasesFromSheet();
    const parsed = rows.map((row, index) => ({ ...row, id: Number(row.id) || index + 1, created_at: String(row.created_at || "") })) as StoredRow[];
    store.cases = parsed;
    store.nextId = Math.max(store.nextId, ...parsed.map((row) => Number(row.id) + 1), 1);
    return { rows: parsed, sha: undefined, persistent: true };
  }
  const github = await readGithubCases();
  if (!github) return { rows: store.cases, sha: undefined, persistent: false };
  store.cases = github.rows;
  store.nextId = Math.max(store.nextId, ...github.rows.map((row) => Number(row.id) + 1), 1);
  return { rows: github.rows, sha: github.sha, persistent: true };
}

async function loadEvents(store: Store) {
  if (hasGoogleSheetStore()) {
    const rows = await loadEventsFromSheet();
    const parsed = rows.map((row, index) => ({ ...row, id: Number(row.id) || index + 1, created_at: String(row.created_at || "") })) as StoredRow[];
    store.events = parsed;
    store.nextId = Math.max(store.nextId, ...parsed.map((row) => Number(row.id) + 1), 1);
    return { rows: parsed, sha: undefined, persistent: true };
  }
  const github = await readGithubEvents();
  if (!github) return { rows: store.events, sha: undefined, persistent: false };
  store.events = github.rows;
  store.nextId = Math.max(store.nextId, ...github.rows.map((row) => Number(row.id) + 1), 1);
  return { rows: github.rows, sha: github.sha, persistent: true };
}

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function filterConstituentRows(rows: Array<Record<string, string>>, request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim().toLowerCase() || "";
  const ward = request.nextUrl.searchParams.get("ward")?.trim().toLowerCase() || "";
  const subgroup = request.nextUrl.searchParams.get("subgroup")?.trim().toLowerCase() || "";
  const limit = Math.max(1, Math.min(Number(request.nextUrl.searchParams.get("limit") || "50000"), 50000));
  let filtered = rows;
  if (ward) filtered = filtered.filter((row) => String(row.ward || "").trim().toLowerCase() === ward);
  if (subgroup) filtered = filtered.filter((row) => String(row.subgroup || "").trim().toLowerCase() === subgroup);
  if (q) {
    filtered = filtered.filter((row) =>
      [
        row.full_name,
        row.street_no,
        row.street,
        row.apt,
        row.city,
        row.state,
        row.zip_code,
        row.voter_id,
        row.ward,
        row.subgroup,
        row.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }
  return filtered.slice(0, limit);
}

function hostedWeatherFallback() {
  const updatedAt = new Date().toISOString();
  return {
    ok: true,
    from_cache: true,
    location: "Orange, NJ",
    temperature: 62,
    high: 74,
    low: 52,
    condition: "Sunny",
    symbol: "☀",
    wind_mph: 8,
    humidity: 45,
    updated_at: updatedAt,
    next_update_at: new Date(Date.now() + WEATHER_REFRESH_SECONDS * 1000).toISOString(),
    refresh_interval_seconds: WEATHER_REFRESH_SECONDS,
    source: "fallback",
  };
}

async function hostedWeather() {
  const url = (
    "https://api.open-meteo.com/v1/forecast"
    + "?latitude=40.7707&longitude=-74.2326"
    + "&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m"
    + "&daily=temperature_2m_max,temperature_2m_min"
    + "&temperature_unit=fahrenheit&wind_speed_unit=mph"
    + "&timezone=America%2FNew_York&forecast_days=1"
  );
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "WardOS" },
      next: { revalidate: WEATHER_REFRESH_SECONDS },
    });
    if (!response.ok) throw new Error(`Weather returned ${response.status}`);
    const data = await response.json() as { current?: Record<string, number>; daily?: Record<string, number[]> };
    const current = data.current || {};
    const daily = data.daily || {};
    const code = Number(current.weather_code || 0);
    const [condition, symbol] = HOSTED_WEATHER_CODES[code] || ["Current Conditions", "◌"];
    const updatedAt = new Date().toISOString();
    return {
      ok: true,
      from_cache: false,
      location: "Orange, NJ",
      temperature: Math.round(Number(current.temperature_2m || 0)),
      high: Math.round(Number((daily.temperature_2m_max || [0])[0] || 0)),
      low: Math.round(Number((daily.temperature_2m_min || [0])[0] || 0)),
      condition,
      symbol,
      wind_mph: Math.round(Number(current.wind_speed_10m || 0)),
      humidity: Math.round(Number(current.relative_humidity_2m || 0)),
      updated_at: updatedAt,
      next_update_at: new Date(Date.now() + WEATHER_REFRESH_SECONDS * 1000).toISOString(),
      refresh_interval_seconds: WEATHER_REFRESH_SECONDS,
      source: "Open-Meteo",
    };
  } catch {
    return hostedWeatherFallback();
  }
}

function normalizePath(params: { path?: string[] }) {
  return `/${(params.path || []).join("/")}`;
}

function upstreamApiUrl(request: NextRequest, route: string) {
  const baseUrl = process.env.WARDOS_API_URL?.trim();
  if (!baseUrl) return null;
  const url = new URL(`${baseUrl.replace(/\/$/, "")}${route}`);
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.append(key, value);
  });
  return url;
}

async function proxyToWardOSApi(request: NextRequest, route: string) {
  const url = upstreamApiUrl(request, route);
  if (!url) return null;
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  const response = await fetch(url, {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.text(),
    cache: "no-store",
  });
  return new NextResponse(response.body, {
    status: response.status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": response.headers.get("content-type") || "application/json",
    },
  });
}

function createRow(store: Store, payload: Record<string, unknown>) {
  const now = new Date().toISOString();
  const row: StoredRow = {
    id: store.nextId,
    ...payload,
    created_at: now,
  };
  store.nextId += 1;
  return row;
}

function dashboardOverview(store: Store) {
  const openCases = store.cases.filter((row) => row.status !== "closed");
  const seededMedia = store.mediaMentions.length ? store.mediaMentions : SEEDED_MEDIA_MENTIONS;
  const publicSafety = store.publicSafetyIncidents.length ? store.publicSafetyIncidents : SEEDED_PUBLIC_SAFETY_INCIDENTS;
  const meetings = [...store.events, ...SEEDED_MEETINGS].sort((a, b) => String(a.starts_at || "").localeCompare(String(b.starts_at || "")));
  return {
    sample_mode: false,
    metrics: {
      open_requests: openCases.length,
      constituents: CONSTITUENT_SUMMARY.total,
      mailin_voters: CONSTITUENT_SUMMARY.mailin_may_2026,
      council_meetings: meetings.length,
      pending_legislation: store.legislation.length,
      development_projects: 87,
      media_mentions: seededMedia.length,
      public_safety_incidents: publicSafety.length,
    },
    priority_issues: openCases.slice(-5).reverse().map((row) => ({
      id: row.id,
      title: row.topic || "Constituent need",
      meta: [row.constituent_name, row.address_line, row.phone, row.email, row.notes].filter(Boolean).join(" · "),
      status: row.status || "open",
      priority: row.priority || "normal",
      created_at: row.created_at,
    })),
    meetings,
    developments: SEEDED_DEVELOPMENTS,
    actions: store.officeActions.slice(-8).reverse(),
  };
}

function mergedSourceConnections(store: Store) {
  const rows = store.sourceConnections.length ? [...store.sourceConnections] : [];
  const names = new Set(rows.map((row) => String(row.name || "").toLowerCase()));
  SEEDED_MEDIA_SOURCES.forEach((source) => {
    if (!names.has(String(source.name).toLowerCase())) rows.push(source);
  });
  return rows;
}

function categoryLabel(category: unknown) {
  const labels: Record<string, string> = {
    traffic: "Traffic",
    violent: "Violent",
    quality_of_life: "Quality of Life",
    infrastructure: "Infrastructure",
    other: "Other",
  };
  return labels[String(category || "other")] || "Other";
}

function publicSafetyDashboard(store: Store) {
  const sourceRows = store.publicSafetyIncidents.length ? store.publicSafetyIncidents : SEEDED_PUBLIC_SAFETY_INCIDENTS;
  const incidents: Array<Record<string, unknown>> = sourceRows.map((sourceRow) => {
    const row = sourceRow as Record<string, unknown>;
    return {
      ...row,
      category_label: row.category_label || categoryLabel(row.category),
    };
  });
  const count = (category: string) => incidents.filter((row) => String(row.category || "") === category).length;
  const resolved = incidents.filter((row) => String(row.status || "").toLowerCase() === "resolved" || String(row.status || "").toLowerCase() === "closed").length;
  const locationCounts = new Map<string, number>();
  incidents.forEach((row) => {
    const location = String(row.location || "South Ward");
    locationCounts.set(location, (locationCounts.get(location) || 0) + 1);
  });
  const dangerousIntersections = [...locationCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([location, incidentCount]) => ({ location, count: incidentCount }));
  const total = incidents.length;
  const violent = count("violent");
  const traffic = count("traffic");
  const quality = count("quality_of_life");
  const infrastructure = count("infrastructure");
  const score = Math.max(0, Math.min(100, 82 - violent * 2 - traffic + resolved));
  return {
    generated_at: new Date().toISOString(),
    source_folder: "data/public_safety",
    metrics: {
      total_incidents: total,
      violent_incidents: violent,
      traffic_incidents: traffic,
      quality_of_life: quality,
      resolved,
    },
    score: {
      value: score,
      label: score >= 70 ? "Good" : score >= 50 ? "Needs Attention" : "High Concern",
      delta: score >= 70 ? "+6 pts vs last 30 days" : "Review with OPD briefing",
    },
    breakdown: [
      { label: "Traffic", category: "traffic", count: traffic },
      { label: "Quality of Life", category: "quality_of_life", count: quality },
      { label: "Violent", category: "violent", count: violent },
      { label: "Infrastructure", category: "infrastructure", count: infrastructure },
      { label: "Other", category: "other", count: count("other") },
    ].filter((row) => row.count > 0),
    dangerous_intersections: dangerousIntersections,
    incidents,
    insights: [
      dangerousIntersections[0] ? `${dangerousIntersections[0].location} has the highest incident concentration in the current set.` : "Upload the current OPD briefing PDF to populate incident hot spots.",
      traffic ? "Traffic incidents should be reviewed for DPW, enforcement, and pedestrian-safety follow-up." : "No traffic incidents recorded in the current set.",
      violent ? "Violent incident records require OPD verification before public comment." : "No violent incidents recorded in the current set.",
    ],
  };
}

export async function GET(request: NextRequest, context: { params: { path?: string[] } }) {
  const route = normalizePath(context.params);
  const upstreamResponse = await proxyToWardOSApi(request, route);
  if (upstreamResponse) return upstreamResponse;

  const store = await readStore();
  if (route === "/dashboard/overview" || route === "/cases" || route === "/cases/export.csv") {
    await loadCases(store);
  }
  if (route === "/dashboard/overview" || route === "/system/status" || route === "/events" || route === "/city-calendar" || route === "/council-meetings") {
    await loadEvents(store);
  }

  if (route === "/health") return json({ ok: true, mode: "hosted-fallback" });
  if (route === "/system/status") {
    return json({
      ok: true,
      timezone: "America/New_York",
      sample_mode: false,
      database: {
        connected: true,
        constituents: CONSTITUENT_SUMMARY.total,
        cases: store.cases.length,
        legislation: store.legislation.length,
        budget_watch: store.budgetWatch.length,
        events: store.events.length + SEEDED_MEETINGS.length,
        development_projects: 87,
        media_mentions: (store.mediaMentions.length ? store.mediaMentions : SEEDED_MEDIA_MENTIONS).length,
        public_safety_incidents: (store.publicSafetyIncidents.length ? store.publicSafetyIncidents : SEEDED_PUBLIC_SAFETY_INCIDENTS).length,
        city_bulletins: 8,
        staff_users: (store.staffUsers.length ? store.staffUsers : SEEDED_STAFF_USERS).length,
      },
      safety: { local_first: true, auto_send_email: false, auto_publish: false, staff_review_required: true },
      integrations: { github: "public_read_only", media_sources: mergedSourceConnections(store).length },
    });
  }
  if (route === "/dashboard/overview") return json(dashboardOverview(store));
  if (route === "/cases") return json([...store.cases].reverse());
  if (route === "/cases/export.csv") {
    return new NextResponse(casesToCsv([...store.cases].reverse(), true), {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="wardos_constituent_cases.csv"',
      },
    });
  }
  if (route === "/legislation") return json([...store.legislation].reverse());
  if (route === "/budget-watch") return json([...store.budgetWatch].reverse());
  if (route === "/development-projects") return json(SEEDED_DEVELOPMENTS);
  if (route === "/development-watch") {
    return json({
      source_url: "Orange Township Planning and Zoning Board pages",
      fetched_at: "2026-06-04T22:10:50.933485-04:00",
      boards: [
        {
          board: "Planning Board",
          source_url: "https://orangetwpnjcc.org/boards-commissions/planning-board/",
          meeting_count: 76,
          watch_count: 36,
        },
        {
          board: "Zoning Board of Adjustment",
          source_url: "https://orangetwpnjcc.org/boards-commissions/zoning-board-of-adjustment/",
          meeting_count: 83,
          watch_count: 51,
        },
      ],
      meeting_count: 159,
      watch_count: 87,
      meetings: SEEDED_MEETINGS.map((meeting) => ({
        source_id: `hosted-${meeting.id}`,
        date: String(meeting.starts_at).slice(0, 10),
        title: meeting.title,
        board: meeting.location,
        location: meeting.location,
        status: meeting.status,
        source_url: meeting.location.includes("Planning") ? "https://orangetwpnjcc.org/boards-commissions/planning-board/" : "https://orangetwpnjcc.org/boards-commissions/zoning-board-of-adjustment/",
        documents: [],
      })),
      watch_items: SEEDED_DEVELOPMENTS,
    });
  }
  if (route === "/office-actions") return json([...store.officeActions].reverse());
  if (route === "/events") return json([...store.events, ...SEEDED_MEETINGS].sort((a, b) => String(a.starts_at || "").localeCompare(String(b.starts_at || ""))));
  if (route === "/media-mentions") return json(store.mediaMentions.length ? [...store.mediaMentions].reverse() : SEEDED_MEDIA_MENTIONS);
  if (route === "/source-connections") return json(mergedSourceConnections(store).reverse());
  if (route === "/staff/users") return json(store.staffUsers.length ? [...store.staffUsers].reverse() : SEEDED_STAFF_USERS);
  if (route === "/staff/roles") return json({ admin: "Administrator", strategy_advisor: "Strategy Advisor" });
  if (route === "/constituents") {
    if (hasGoogleSheetStore()) {
      const rows = await loadConstituentsFromSheet();
      return json(filterConstituentRows(rows, request));
    }
    return json([]);
  }
  if (route === "/constituents/summary") {
    if (hasGoogleSheetStore()) {
      const rows = await loadConstituentsFromSheet();
      const summary = summarizeConstituentRows(rows);
      return json({
        ...summary,
        mailin_may_2026: Object.entries(summary.by_subgroup).reduce((total, [name, count]) => total + (/mail-?in/i.test(name) ? count : 0), 0),
        average_days_to_return: "N/A",
      });
    }
    return json(CONSTITUENT_SUMMARY);
  }
  if (route === "/media-monitor") {
    const stories = store.mediaMentions.length ? store.mediaMentions : SEEDED_MEDIA_MENTIONS;
    return json({
      mentions: stories.length,
      sentiment: "staff_review",
      topics: [
        { topic: "Schools", count: 2, label: "Schools", share: 67 },
        { topic: "Community", count: 1, label: "Community", share: 33 },
      ],
      stories,
      alerts: [],
      actions: [],
    });
  }
  if (route === "/media-monitor/config") return json(SEEDED_MEDIA_CONFIG);
  if (route === "/public-safety") return json(publicSafetyDashboard(store));
  if (route === "/weather/today") {
    return json(await hostedWeather());
  }
  if (route.startsWith("/integrations/github/")) {
    const name = route.replace("/integrations/github/", "") as keyof typeof GITHUB_SOURCES;
    if (name === "budget") return json(normalizeBudget(await fetchGithubSource("budget")));
    if (name === "progress") return json(normalizeProgress(await fetchGithubSource("progress")));
    if (name === "legislation") return json(normalizeLegislation(await fetchGithubSource("legislation")));
    return json({ ok: false, error: `Unknown GitHub integration: ${name}` }, 404);
  }
  if (route === "/city-calendar" || route === "/council-meetings") {
    const events = [...store.events, ...SEEDED_MEETINGS].sort((a, b) => String(a.starts_at || "").localeCompare(String(b.starts_at || "")));
    return json({ source_url: "https://orangenj.gov/Calendar.aspx", fetched_at: "2026-06-04T22:10:52.036746-04:00", events, meetings: events });
  }
  if (route === "/city-bulletins") {
    return json({
      source_url: "https://orangenj.gov/",
      fetched_at: "2026-06-04T22:10:50.490748-04:00",
      bulletin_count: 8,
      bulletins: [
        { title: "Community Food Distribution Day", bulletin_type: "civic_alert", url: "https://orangenj.gov/CivicAlerts.aspx?AID=551", status: "posted" },
        { title: "Community Meeting Q&A", bulletin_type: "civic_alert", url: "https://orangenj.gov/CivicAlerts.aspx?AID=545", status: "posted" },
        { title: "MOBILE MAMMOGRAM SCREENING", bulletin_type: "civic_alert", url: "https://orangenj.gov/CivicAlerts.aspx?AID=556", status: "posted" },
        { title: "Police Community Council Meeting", bulletin_type: "civic_alert", url: "https://orangenj.gov/CivicAlerts.aspx?AID=527", status: "posted" },
        { title: "SEASONAL EMERGENCY PREPAREDNESS APR-JUN 2026", bulletin_type: "civic_alert", url: "https://orangenj.gov/CivicAlerts.aspx?AID=543", status: "posted" },
        { title: "Shredding Event 2026", bulletin_type: "civic_alert", url: "https://orangenj.gov/CivicAlerts.aspx?AID=526", status: "posted" },
        { title: "EMERGENCY ALERT", bulletin_type: "emergency_alert", url: "https://orangenj.gov/AlertCenter.aspx", status: "posted" },
        { title: "SNAP Recipients - Find Food Sources Near You", bulletin_type: "emergency_alert", url: "https://orangenj.gov/AlertCenter.aspx?AID=SNAP-Recipients-Find-Food-Sources-Near-Y-34", status: "posted" },
      ],
    });
  }

  return json({ error: `WardOS hosted API route not found: ${route}` }, 404);
}

export async function POST(request: NextRequest, context: { params: { path?: string[] } }) {
  const route = normalizePath(context.params);
  const upstreamResponse = await proxyToWardOSApi(request, route);
  if (upstreamResponse) return upstreamResponse;

  const store = await readStore();
  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  let row: StoredRow | null = null;

  if (route === "/cases") {
    const existingCases = await loadCases(store);
    row = createRow(store, { status: "open", priority: "normal", ...payload });
    store.cases = [...existingCases.rows, row];
    if (hasGoogleSheetWriteStore()) await appendCaseToSheet(row);
    else if (existingCases.persistent) await writeGithubCases(store.cases, existingCases.sha);
    await writeStore(store);
    return json({ ...row, status: row.status || "created", persistent: existingCases.persistent }, 201);
  } else if (route === "/legislation") {
    row = createRow(store, { status: "tracking", ...payload });
    store.legislation.push(row);
  } else if (route === "/budget-watch") {
    row = createRow(store, { status: "watching", ...payload });
    store.budgetWatch.push(row);
  } else if (route === "/office-actions") {
    row = createRow(store, { status: "draft", priority: "normal", ...payload });
    store.officeActions.push(row);
  } else if (route === "/events") {
    const existingEvents = await loadEvents(store);
    row = createRow(store, { status: "scheduled", event_type: "office_event", ...payload });
    store.events = [...existingEvents.rows, row];
    if (hasGoogleSheetWriteStore()) await appendEventToSheet(row);
    else if (existingEvents.persistent) await writeGithubEvents(store.events, existingEvents.sha);
    await writeStore(store);
    return json({ ...row, persistent: existingEvents.persistent }, 201);
  } else if (route === "/media-mentions") {
    row = createRow(store, { sentiment: "neutral", ...payload });
    store.mediaMentions.push(row);
  } else if (route === "/public-safety/incidents") {
    row = createRow(store, { status: "reported", severity: "medium", ward: "South Ward", category: "other", ...payload });
    store.publicSafetyIncidents.push(row);
  } else if (route === "/source-connections") {
    row = createRow(store, { enabled: true, status: "not_configured", ...payload });
    store.sourceConnections.push(row);
  } else if (route === "/staff/import-users") {
    await writeStore(store);
    return json({ imported: 0, updated: 0, status: "complete" });
  } else if (route === "/media-monitor/import-sources") {
    store.sourceConnections = mergedSourceConnections(store);
    await writeStore(store);
    return json({ imported: store.sourceConnections.length, skipped: 0, status: "complete" });
  } else if (route.endsWith("/sync") || route.endsWith("/import-sources")) {
    await writeStore(store);
    return json({ status: "queued", imported: 0, updated: 0 });
  } else {
    return json({ error: `WardOS hosted API route not found: ${route}` }, 404);
  }

  if (!row) return json({ error: `WardOS hosted API route not found: ${route}` }, 404);
  await writeStore(store);
  return json({ id: row.id, status: "created" }, 201);
}
