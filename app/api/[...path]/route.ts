import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StoredRow = Record<string, unknown> & { id: number; created_at: string };

type Store = {
  nextId: number;
  cases: StoredRow[];
  legislation: StoredRow[];
  budgetWatch: StoredRow[];
  officeActions: StoredRow[];
  mediaMentions: StoredRow[];
  sourceConnections: StoredRow[];
  staffUsers: StoredRow[];
};

const STORE_PATH = path.join("/tmp", "wardos-hosted-api-store.json");
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

function emptyStore(): Store {
  return {
    nextId: 1,
    cases: [],
    legislation: [],
    budgetWatch: [],
    officeActions: [],
    mediaMentions: [],
    sourceConnections: [],
    staffUsers: [],
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

function githubCaseStorageConfig() {
  const repo = process.env.WARDOS_CASE_LOG_REPO?.trim();
  const token = process.env.WARDOS_CASE_LOG_TOKEN?.trim() || process.env.GITHUB_TOKEN?.trim();
  const branch = process.env.WARDOS_CASE_LOG_BRANCH?.trim() || "main";
  const filePath = process.env.WARDOS_CASE_LOG_PATH?.trim() || "data/constituent_cases.csv";
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

async function loadCases(store: Store) {
  const github = await readGithubCases();
  if (!github) return { rows: store.cases, sha: undefined, persistent: false };
  store.cases = github.rows;
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

function normalizePath(params: { path?: string[] }) {
  return `/${(params.path || []).join("/")}`;
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
  return {
    sample_mode: false,
    metrics: {
      open_requests: openCases.length,
      constituents: 0,
      mailin_voters: 0,
      council_meetings: 0,
      pending_legislation: store.legislation.length,
      development_projects: 0,
      media_mentions: store.mediaMentions.length,
    },
    priority_issues: openCases.slice(-5).reverse().map((row) => ({
      id: row.id,
      title: row.topic || "Constituent need",
      meta: [row.constituent_name, row.address_line, row.phone, row.email, row.notes].filter(Boolean).join(" · "),
      status: row.status || "open",
      priority: row.priority || "normal",
      created_at: row.created_at,
    })),
    meetings: [],
    developments: [],
    actions: store.officeActions.slice(-8).reverse(),
  };
}

export async function GET(_request: NextRequest, context: { params: { path?: string[] } }) {
  const route = normalizePath(context.params);
  const store = await readStore();
  if (route === "/dashboard/overview" || route === "/cases" || route === "/cases/export.csv") {
    await loadCases(store);
  }

  if (route === "/health") return json({ ok: true, mode: "hosted-fallback" });
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
  if (route === "/office-actions") return json([...store.officeActions].reverse());
  if (route === "/media-mentions") return json([...store.mediaMentions].reverse());
  if (route === "/source-connections") return json([...store.sourceConnections].reverse());
  if (route === "/staff/users") return json([...store.staffUsers].reverse());
  if (route === "/staff/roles") return json({ admin: "Administrator", strategy_advisor: "Strategy Advisor" });
  if (route === "/constituents") return json([]);
  if (route === "/constituents/summary") {
    return json({ total: 0, by_status: {}, by_subgroup: {}, by_ward: {}, mailin_may_2026: 0, received: 0, outstanding: 0 });
  }
  if (route === "/media-monitor") return json({ mentions: store.mediaMentions.length, topics: [], stories: store.mediaMentions, alerts: [], actions: [] });
  if (route === "/media-monitor/config") return json(null);
  if (route === "/weather/today") {
    return json({ ok: true, location: "Orange, NJ", temperature: 62, high: 74, low: 52, condition: "Sunny", symbol: "☀" });
  }
  if (route.startsWith("/integrations/github/")) {
    return json({ ok: true, from_cache: true, summary: {}, items: [], rows: [] });
  }
  if (route === "/city-bulletins" || route === "/city-calendar" || route === "/council-meetings") {
    return json({ source_url: "", fetched_at: null, events: [], bulletins: [], meetings: [] });
  }

  return json({ error: `WardOS hosted API route not found: ${route}` }, 404);
}

export async function POST(request: NextRequest, context: { params: { path?: string[] } }) {
  const route = normalizePath(context.params);
  const store = await readStore();
  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  let row: StoredRow | null = null;

  if (route === "/cases") {
    const existingCases = await loadCases(store);
    row = createRow(store, { status: "open", priority: "normal", ...payload });
    store.cases.push(row);
    if (existingCases.persistent) await writeGithubCases(store.cases, existingCases.sha);
    await writeStore(store);
    return json({ id: row.id, status: "created", persistent: existingCases.persistent }, 201);
  } else if (route === "/legislation") {
    row = createRow(store, { status: "tracking", ...payload });
    store.legislation.push(row);
  } else if (route === "/budget-watch") {
    row = createRow(store, { status: "watching", ...payload });
    store.budgetWatch.push(row);
  } else if (route === "/office-actions") {
    row = createRow(store, { status: "draft", priority: "normal", ...payload });
    store.officeActions.push(row);
  } else if (route === "/media-mentions") {
    row = createRow(store, { sentiment: "neutral", ...payload });
    store.mediaMentions.push(row);
  } else if (route === "/source-connections") {
    row = createRow(store, { enabled: true, status: "not_configured", ...payload });
    store.sourceConnections.push(row);
  } else if (route === "/staff/import-users") {
    await writeStore(store);
    return json({ imported: 0, updated: 0, status: "complete" });
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
