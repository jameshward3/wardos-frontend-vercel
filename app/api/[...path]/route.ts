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
      meta: row.notes || row.constituent_name || "",
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

  if (route === "/health") return json({ ok: true, mode: "hosted-fallback" });
  if (route === "/dashboard/overview") return json(dashboardOverview(store));
  if (route === "/cases") return json([...store.cases].reverse());
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
    row = createRow(store, { status: "open", priority: "normal", ...payload });
    store.cases.push(row);
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
