// @ts-nocheck
import { neon } from "@neondatabase/serverless";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
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
  sourceConnections,
  staffUsers,
  wardosMemoryItems,
} from "../db/schema";

export function hasPostgresStore() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

let cachedDb: ReturnType<typeof drizzle> | null = null;

export function wardosDb() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error("DATABASE_URL is not configured");
  if (!cachedDb) cachedDb = drizzle(neon(url));
  return cachedDb;
}

function iso(value: unknown) {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function numberOrBlank(value: unknown) {
  if (value === null || value === undefined || value === "") return "";
  return String(value);
}

function constituentRow(row) {
  return {
    id: row.legacyId || row.sourceRowNumber || row.id,
    voter_id: row.voterId || "",
    first_name: row.firstName || "",
    last_name: row.lastName || "",
    full_name: row.fullName || "",
    street_no: row.streetNo || "",
    street: row.street || "",
    apt: row.apt || "",
    city: row.city || "",
    state: row.state || "",
    zip_code: row.zipCode || "",
    ward: row.ward || "",
    subgroup: row.subgroup || "",
    voter_status: row.voterStatus || "",
    mailin_request_date: iso(row.mailinRequestDate).slice(0, 10),
    mailin_sent_date: iso(row.mailinSentDate).slice(0, 10),
    mailin_received_date: iso(row.mailinReceivedDate).slice(0, 10),
    days_to_return: numberOrBlank(row.daysToReturn),
    source_file: row.sourceFile || "",
    notes: row.notes || "",
    created_at: iso(row.createdAt),
    updated_at: iso(row.updatedAt),
    source_tab_name: row.sourceTabName,
    source_row_number: row.sourceRowNumber,
  };
}

function caseRow(row) {
  return {
    id: row.legacyId || row.sourceRowNumber || row.id,
    created_at: iso(row.createdAt),
    constituent_name: row.constituentName || "",
    address_line: row.addressLine || "",
    phone: row.phone || "",
    email: row.email || "",
    topic: row.topic || "",
    category: row.category || "",
    department: row.department || "",
    assigned_to: row.assignedTo || "",
    ward: row.ward || "",
    source: row.source || "",
    status: row.status || "open",
    priority: row.priority || "normal",
    notes: row.notes || "",
    latitude: numberOrBlank(row.latitude),
    longitude: numberOrBlank(row.longitude),
    due_at: iso(row.dueAt),
    resolved_at: iso(row.resolvedAt),
    source_tab_name: row.sourceTabName,
    source_row_number: row.sourceRowNumber,
  };
}

function eventRow(row) {
  return {
    id: row.legacyId || row.sourceRowNumber || row.id,
    created_at: iso(row.createdAt),
    title: row.title || "",
    starts_at: iso(row.startsAt),
    location: row.location || "",
    event_type: row.eventType || "",
    status: row.status || "scheduled",
    notes: row.notes || "",
    source_url: row.sourceUrl || "",
    source_id: row.sourceId || "",
    source_tab_name: row.sourceTabName,
    source_row_number: row.sourceRowNumber,
  };
}

function memoryRow(row) {
  return {
    memory_key: row.memoryKey,
    category: row.category,
    source_table: row.sourceTable,
    source_id: row.sourceId,
    title: row.title,
    summary: row.summary,
    status: row.status,
    priority: row.priority,
    owner: row.owner,
    event_date: iso(row.eventDate),
    url: row.url,
    tags: Array.isArray(row.tags) ? row.tags.join(",") : "",
    payload_json: JSON.stringify(row.payload || {}),
    sheet_name: row.sheetName,
    row_hash: row.sheetRowHash,
    last_seen_at: iso(row.lastSeenAt),
    created_at: iso(row.createdAt),
    updated_at: iso(row.updatedAt),
    source_tab_name: row.sourceTabName,
    source_row_number: row.sourceRowNumber,
  };
}

function domainRow(row, kind: string) {
  const payload = row.payload || {};
  const common = {
    id: row.legacyId || row.sourceRowNumber || row.id,
    created_at: iso(row.createdAt),
    updated_at: iso(row.updatedAt),
    status: row.status || "",
    notes: row.notes || row.summary || "",
    source_url: row.sourceUrl || row.url || "",
    source_id: row.sourceId || "",
    source_tab_name: row.sourceTabName,
    source_row_number: row.sourceRowNumber,
    payload,
  };
  if (kind === "development") return { ...common, name: row.name, address: row.address, project_type: row.projectType, board: row.board, latitude: numberOrBlank(row.latitude), longitude: numberOrBlank(row.longitude) };
  if (kind === "media") return { ...common, source: row.source, source_type: row.sourceType, headline: row.headline, summary: row.summary, url: row.url, sentiment: row.sentiment, topic: row.topic, geographic_tag: row.geographicTag, engagement_score: row.engagementScore, latitude: numberOrBlank(row.latitude), longitude: numberOrBlank(row.longitude), published_at: iso(row.publishedAt) };
  if (kind === "public_safety") return { ...common, incident_type: row.incidentType, category: row.category, title: row.title, location: row.location, occurred_at: iso(row.occurredAt), severity: row.severity, ward: row.ward, latitude: numberOrBlank(row.latitude), longitude: numberOrBlank(row.longitude), source_file: row.sourceFile };
  if (kind === "office_actions") return { ...common, title: row.title, action_type: row.actionType, priority: row.priority, owner: row.owner, due_at: iso(row.dueAt), source_type: row.sourceType };
  if (kind === "sources") return { ...common, name: row.name, source_type: row.sourceType, url: row.url, enabled: row.enabled, last_sync_at: iso(row.lastSyncAt) };
  if (kind === "staff") return { ...common, full_name: row.fullName, email: row.email, role: row.role, title: row.title, is_active: row.isActive };
  return { ...common, title: row.title || row.name || row.headline || "" };
}

export async function postgresStatus() {
  if (!hasPostgresStore()) return { configured: false, connected: false, error: "DATABASE_URL is not configured" };
  try {
    const db = wardosDb();
    const [memoryCount] = await db.select({ count: sql<number>`count(*)::int` }).from(wardosMemoryItems);
    const [constituentCount] = await db.select({ count: sql<number>`count(*)::int` }).from(constituents);
    const [caseCount] = await db.select({ count: sql<number>`count(*)::int` }).from(constituentCases);
    const [eventCount] = await db.select({ count: sql<number>`count(*)::int` }).from(events);
    return {
      configured: true,
      connected: true,
      source: "postgres",
      counts: {
        memory_items: memoryCount?.count || 0,
        constituents: constituentCount?.count || 0,
        cases: caseCount?.count || 0,
        events: eventCount?.count || 0,
      },
      error: "",
    };
  } catch (error) {
    return { configured: true, connected: false, source: "postgres", counts: {}, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function loadPostgresMemory(limit = 50) {
  if (!hasPostgresStore()) return null;
  const db = wardosDb();
  const rows = await db.select().from(wardosMemoryItems).where(sql`${wardosMemoryItems.deletedAt} is null`).orderBy(desc(wardosMemoryItems.updatedAt)).limit(Math.max(1, Math.min(limit, 500)));
  const categoryRows = await db.select({ category: wardosMemoryItems.category, count: sql<number>`count(*)::int` }).from(wardosMemoryItems).where(sql`${wardosMemoryItems.deletedAt} is null`).groupBy(wardosMemoryItems.category);
  const byCategory = Object.fromEntries(categoryRows.map((row) => [row.category, row.count]));
  return {
    summary: {
      total: categoryRows.reduce((sum, row) => sum + Number(row.count || 0), 0),
      by_category: byCategory,
      source: "postgres",
      fields: [
        "memory_key",
        "category",
        "source_table",
        "source_id",
        "title",
        "summary",
        "status",
        "priority",
        "owner",
        "event_date",
        "url",
        "tags",
        "payload_json",
        "sheet_name",
        "row_hash",
        "last_seen_at",
        "created_at",
        "updated_at",
      ],
    },
    recent: rows.map(memoryRow),
  };
}

export async function loadPostgresConstituents(request: Request) {
  if (!hasPostgresStore()) return null;
  const db = wardosDb();
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() || "";
  const ward = url.searchParams.get("ward")?.trim() || "";
  const subgroup = url.searchParams.get("subgroup")?.trim() || "";
  const limit = Math.max(1, Math.min(Number(url.searchParams.get("limit") || "750"), 50000));
  const filters = [sql`${constituents.deletedAt} is null`];
  if (ward) filters.push(eq(constituents.ward, ward));
  if (subgroup) filters.push(eq(constituents.subgroup, subgroup));
  if (q) {
    const pattern = `%${q}%`;
    filters.push(or(ilike(constituents.fullName, pattern), ilike(constituents.street, pattern), ilike(constituents.voterId, pattern), ilike(constituents.notes, pattern)));
  }
  const rows = await db.select().from(constituents).where(and(...filters)).orderBy(constituents.ward, constituents.fullName).limit(limit);
  return rows.map(constituentRow);
}

export async function summarizePostgresConstituents() {
  if (!hasPostgresStore()) return null;
  const db = wardosDb();
  const rows = await db.select({
    ward: constituents.ward,
    subgroup: constituents.subgroup,
    status: constituents.voterStatus,
    count: sql<number>`count(*)::int`,
  }).from(constituents).where(sql`${constituents.deletedAt} is null`).groupBy(constituents.ward, constituents.subgroup, constituents.voterStatus);
  const byWard: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const bySubgroup: Record<string, number> = {};
  let total = 0;
  let received = 0;
  let outstanding = 0;
  for (const row of rows) {
    const count = Number(row.count || 0);
    total += count;
    byWard[row.ward || "Unknown"] = (byWard[row.ward || "Unknown"] || 0) + count;
    byStatus[row.status || "Unknown"] = (byStatus[row.status || "Unknown"] || 0) + count;
    bySubgroup[row.subgroup || "Unspecified"] = (bySubgroup[row.subgroup || "Unspecified"] || 0) + count;
    if (String(row.status || "").toLowerCase() === "received") received += count;
    else outstanding += count;
  }
  return {
    total,
    by_ward: byWard,
    by_status: byStatus,
    by_subgroup: bySubgroup,
    received,
    outstanding,
    mailin_may_2026: Object.entries(bySubgroup).reduce((sum, [name, count]) => sum + (/mail-?in/i.test(name) ? count : 0), 0),
    average_days_to_return: "N/A",
    source: "postgres",
  };
}

export async function loadPostgresCases() {
  if (!hasPostgresStore()) return null;
  const db = wardosDb();
  return (await db.select().from(constituentCases).where(sql`${constituentCases.deletedAt} is null`).orderBy(desc(constituentCases.createdAt)).limit(1000)).map(caseRow);
}

export async function createPostgresCase(payload: Record<string, unknown>) {
  if (!hasPostgresStore()) return null;
  const db = wardosDb();
  const now = new Date();
  const [row] = await db.insert(constituentCases).values({
    constituentName: String(payload.constituent_name || payload.constituentName || "Unknown constituent"),
    addressLine: String(payload.address_line || payload.addressLine || ""),
    phone: String(payload.phone || ""),
    email: String(payload.email || ""),
    topic: String(payload.topic || "Constituent need"),
    category: String(payload.category || ""),
    department: String(payload.department || ""),
    assignedTo: String(payload.assigned_to || payload.assignedTo || ""),
    ward: String(payload.ward || ""),
    source: String(payload.source || "wardos_web"),
    status: String(payload.status || "open"),
    priority: String(payload.priority || "normal"),
    notes: String(payload.notes || ""),
    latitude: numericOrBlank(payload.latitude) || null,
    longitude: numericOrBlank(payload.longitude) || null,
    dueAt: payload.due_at ? new Date(String(payload.due_at)) : null,
    resolvedAt: payload.resolved_at ? new Date(String(payload.resolved_at)) : null,
    sourceSpreadsheetId: "wardos_postgres",
    sourceTabName: "wardos_web",
    sourceRowNumber: null,
    sourceRowHash: "",
    createdAt: now,
    updatedAt: now,
  }).returning();
  return { ...caseRow(row), persistent: true, source: "postgres" };
}

export async function loadPostgresEvents() {
  if (!hasPostgresStore()) return null;
  const db = wardosDb();
  return (await db.select().from(events).where(sql`${events.deletedAt} is null`).orderBy(events.startsAt).limit(1000)).map(eventRow);
}

export async function createPostgresEvent(payload: Record<string, unknown>) {
  if (!hasPostgresStore()) return null;
  const db = wardosDb();
  const now = new Date();
  const [row] = await db.insert(events).values({
    title: String(payload.title || "WardOS event"),
    startsAt: payload.starts_at ? new Date(String(payload.starts_at)) : null,
    location: String(payload.location || ""),
    eventType: String(payload.event_type || payload.eventType || "office_event"),
    status: String(payload.status || "scheduled"),
    notes: String(payload.notes || ""),
    sourceUrl: String(payload.source_url || payload.sourceUrl || ""),
    sourceId: String(payload.source_id || payload.sourceId || ""),
    sourceSpreadsheetId: "wardos_postgres",
    sourceTabName: "wardos_web",
    sourceRowNumber: null,
    sourceRowHash: "",
    createdAt: now,
    updatedAt: now,
  }).returning();
  return { ...eventRow(row), persistent: true, source: "postgres" };
}

export async function loadPostgresDomain(kind: "development" | "media" | "public_safety" | "office_actions" | "sources" | "staff") {
  if (!hasPostgresStore()) return null;
  const db = wardosDb();
  if (kind === "development") return (await db.select().from(developmentProjects).where(sql`${developmentProjects.deletedAt} is null`).orderBy(desc(developmentProjects.createdAt)).limit(500)).map((row) => domainRow(row, kind));
  if (kind === "media") return (await db.select().from(mediaMentions).where(sql`${mediaMentions.deletedAt} is null`).orderBy(desc(mediaMentions.publishedAt)).limit(500)).map((row) => domainRow(row, kind));
  if (kind === "public_safety") return (await db.select().from(publicSafetyIncidents).where(sql`${publicSafetyIncidents.deletedAt} is null`).orderBy(desc(publicSafetyIncidents.occurredAt)).limit(500)).map((row) => domainRow(row, kind));
  if (kind === "office_actions") return (await db.select().from(officeActions).where(sql`${officeActions.deletedAt} is null`).orderBy(desc(officeActions.createdAt)).limit(500)).map((row) => domainRow(row, kind));
  if (kind === "sources") return (await db.select().from(sourceConnections).where(sql`${sourceConnections.deletedAt} is null`).orderBy(sourceConnections.name).limit(500)).map((row) => domainRow(row, kind));
  if (kind === "staff") return (await db.select().from(staffUsers).where(sql`${staffUsers.deletedAt} is null`).orderBy(staffUsers.fullName).limit(100)).map((row) => domainRow(row, kind));
  return null;
}

export const migrationTables = {
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
  sourceConnections,
  staffUsers,
  wardosMemoryItems,
};
