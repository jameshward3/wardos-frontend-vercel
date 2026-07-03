import { relations, sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
};

const sourceColumns = {
  sourceSpreadsheetId: text("source_spreadsheet_id").notNull(),
  sourceTabName: text("source_tab_name").notNull(),
  sourceRowNumber: integer("source_row_number"),
  sourceRowHash: text("source_row_hash").notNull().default(""),
};

export const sheetImportRuns = pgTable("sheet_import_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  spreadsheetId: text("spreadsheet_id").notNull(),
  mode: text("mode").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  status: text("status").notNull().default("running"),
  tabsFound: jsonb("tabs_found").$type<Array<Record<string, unknown>>>().notNull().default(sql`'[]'::jsonb`),
  summary: jsonb("summary").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sheetSourceRows = pgTable(
  "sheet_source_rows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    importRunId: uuid("import_run_id").references(() => sheetImportRuns.id),
    spreadsheetId: text("spreadsheet_id").notNull(),
    tabName: text("tab_name").notNull(),
    sheetRowNumber: integer("sheet_row_number").notNull(),
    normalizedTabName: text("normalized_tab_name").notNull(),
    rowHash: text("row_hash").notNull(),
    rawValues: jsonb("raw_values").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    mappedTable: text("mapped_table"),
    mappedRecordKey: text("mapped_record_key"),
    status: text("status").notNull().default("seen"),
    error: text("error").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("uq_sheet_source_row_identity").on(table.spreadsheetId, table.tabName, table.sheetRowNumber, table.rowHash),
    index("ix_sheet_source_rows_tab_table").on(table.tabName, table.mappedTable),
    index("ix_sheet_source_rows_mapping").on(table.mappedTable, table.mappedRecordKey),
  ],
);

export const wardosMemoryItems = pgTable(
  "wardos_memory_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    memoryKey: text("memory_key").notNull(),
    category: text("category").notNull(),
    sourceTable: text("source_table").notNull(),
    sourceId: text("source_id").notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull().default(""),
    status: text("status").notNull().default(""),
    priority: text("priority").notNull().default(""),
    owner: text("owner").notNull().default(""),
    eventDate: timestamp("event_date", { withTimezone: true }),
    url: text("url").notNull().default(""),
    tags: text("tags").array().notNull().default(sql`ARRAY[]::text[]`),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    sheetName: text("sheet_name").notNull().default(""),
    sheetRowHash: text("sheet_row_hash").notNull().default(""),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    ...sourceColumns,
    ...timestamps,
  },
  (table) => [
    uniqueIndex("uq_wardos_memory_items_memory_key").on(table.memoryKey),
    index("ix_wardos_memory_items_category_updated").on(table.category, table.updatedAt),
    index("ix_wardos_memory_items_source").on(table.sourceTable, table.sourceId),
    index("ix_wardos_memory_items_payload_gin").using("gin", table.payload),
    index("ix_wardos_memory_items_tags_gin").using("gin", table.tags),
  ],
);

export const constituents = pgTable(
  "constituents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    legacyId: integer("legacy_id"),
    voterId: text("voter_id"),
    firstName: text("first_name").notNull().default(""),
    lastName: text("last_name").notNull().default(""),
    fullName: text("full_name").notNull(),
    streetNo: text("street_no").notNull().default(""),
    street: text("street").notNull().default(""),
    apt: text("apt").notNull().default(""),
    city: text("city").notNull().default(""),
    state: text("state").notNull().default(""),
    zipCode: text("zip_code").notNull().default(""),
    ward: text("ward").notNull().default(""),
    subgroup: text("subgroup").notNull().default(""),
    voterStatus: text("voter_status").notNull().default(""),
    mailinRequestDate: date("mailin_request_date"),
    mailinSentDate: date("mailin_sent_date"),
    mailinReceivedDate: date("mailin_received_date"),
    daysToReturn: integer("days_to_return"),
    sourceFile: text("source_file").notNull().default(""),
    notes: text("notes").notNull().default(""),
    ...sourceColumns,
    ...timestamps,
  },
  (table) => [
    uniqueIndex("uq_constituents_voter_id").on(table.voterId).where(sql`${table.voterId} is not null and ${table.voterId} <> ''`),
    uniqueIndex("uq_constituents_sheet_row").on(table.sourceSpreadsheetId, table.sourceTabName, table.sourceRowNumber),
    index("ix_constituents_ward_subgroup").on(table.ward, table.subgroup),
    index("ix_constituents_street_lookup").on(table.street, table.streetNo, table.zipCode),
    index("ix_constituents_search").using("gin", sql`to_tsvector('english', coalesce(${table.fullName}, '') || ' ' || coalesce(${table.street}, '') || ' ' || coalesce(${table.notes}, '') || ' ' || coalesce(${table.voterId}, ''))`),
  ],
);

export const constituentCases = pgTable(
  "constituent_cases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    legacyId: integer("legacy_id"),
    constituentId: uuid("constituent_id").references(() => constituents.id),
    constituentName: text("constituent_name").notNull(),
    addressLine: text("address_line").notNull().default(""),
    phone: text("phone").notNull().default(""),
    email: text("email").notNull().default(""),
    topic: text("topic").notNull(),
    category: text("category").notNull().default(""),
    department: text("department").notNull().default(""),
    assignedTo: text("assigned_to").notNull().default(""),
    ward: text("ward").notNull().default(""),
    source: text("source").notNull().default("google_sheet"),
    status: text("status").notNull().default("open"),
    priority: text("priority").notNull().default("normal"),
    notes: text("notes").notNull().default(""),
    latitude: numeric("latitude"),
    longitude: numeric("longitude"),
    dueAt: timestamp("due_at", { withTimezone: true }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    ...sourceColumns,
    ...timestamps,
  },
  (table) => [
    uniqueIndex("uq_constituent_cases_sheet_row").on(table.sourceSpreadsheetId, table.sourceTabName, table.sourceRowNumber),
    index("ix_constituent_cases_status_created").on(table.status, table.createdAt),
    index("ix_constituent_cases_constituent").on(table.constituentId),
    index("ix_constituent_cases_search").using("gin", sql`to_tsvector('english', coalesce(${table.constituentName}, '') || ' ' || coalesce(${table.addressLine}, '') || ' ' || coalesce(${table.topic}, '') || ' ' || coalesce(${table.notes}, ''))`),
  ],
);

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    legacyId: integer("legacy_id"),
    title: text("title").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    location: text("location").notNull().default(""),
    eventType: text("event_type").notNull().default("event"),
    status: text("status").notNull().default("scheduled"),
    notes: text("notes").notNull().default(""),
    sourceUrl: text("source_url").notNull().default(""),
    sourceId: text("source_id").notNull().default(""),
    ...sourceColumns,
    ...timestamps,
  },
  (table) => [
    uniqueIndex("uq_events_sheet_row").on(table.sourceSpreadsheetId, table.sourceTabName, table.sourceRowNumber),
    index("ix_events_status_starts").on(table.status, table.startsAt),
    index("ix_events_source_id").on(table.sourceId),
  ],
);

export const developmentProjects = pgTable(
  "development_projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    legacyId: integer("legacy_id"),
    name: text("name").notNull(),
    address: text("address").notNull().default(""),
    projectType: text("project_type").notNull().default(""),
    status: text("status").notNull().default("tracking"),
    board: text("board").notNull().default(""),
    latitude: numeric("latitude"),
    longitude: numeric("longitude"),
    notes: text("notes").notNull().default(""),
    sourceUrl: text("source_url").notNull().default(""),
    sourceId: text("source_id").notNull().default(""),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    ...sourceColumns,
    ...timestamps,
  },
  (table) => [
    uniqueIndex("uq_development_projects_sheet_row").on(table.sourceSpreadsheetId, table.sourceTabName, table.sourceRowNumber),
    index("ix_development_projects_status_created").on(table.status, table.createdAt),
  ],
);

export const mediaMentions = pgTable(
  "media_mentions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    legacyId: integer("legacy_id"),
    source: text("source").notNull().default(""),
    sourceType: text("source_type").notNull().default("news"),
    headline: text("headline").notNull(),
    summary: text("summary").notNull().default(""),
    url: text("url").notNull().default(""),
    sentiment: text("sentiment").notNull().default("neutral"),
    topic: text("topic").notNull().default(""),
    geographicTag: text("geographic_tag").notNull().default(""),
    engagementScore: integer("engagement_score").notNull().default(0),
    latitude: numeric("latitude"),
    longitude: numeric("longitude"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    ...sourceColumns,
    ...timestamps,
  },
  (table) => [
    uniqueIndex("uq_media_mentions_sheet_row").on(table.sourceSpreadsheetId, table.sourceTabName, table.sourceRowNumber),
    index("ix_media_mentions_source_published").on(table.sourceType, table.publishedAt),
    index("ix_media_mentions_sentiment_topic").on(table.sentiment, table.topic),
  ],
);

export const publicSafetyIncidents = pgTable(
  "public_safety_incidents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    legacyId: integer("legacy_id"),
    incidentType: text("incident_type").notNull().default("incident"),
    category: text("category").notNull().default("other"),
    title: text("title").notNull(),
    location: text("location").notNull().default(""),
    occurredAt: timestamp("occurred_at", { withTimezone: true }),
    status: text("status").notNull().default("reported"),
    severity: text("severity").notNull().default("medium"),
    ward: text("ward").notNull().default("South Ward"),
    latitude: numeric("latitude"),
    longitude: numeric("longitude"),
    sourceFile: text("source_file").notNull().default(""),
    sourceUrl: text("source_url").notNull().default(""),
    notes: text("notes").notNull().default(""),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    ...sourceColumns,
    ...timestamps,
  },
  (table) => [
    uniqueIndex("uq_public_safety_sheet_row").on(table.sourceSpreadsheetId, table.sourceTabName, table.sourceRowNumber),
    index("ix_public_safety_status_occurred").on(table.status, table.occurredAt),
  ],
);

export const legislationItems = pgTable(
  "legislation_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    legacyId: integer("legacy_id"),
    billNumber: text("bill_number").notNull().default(""),
    title: text("title").notNull(),
    status: text("status").notNull().default("tracking"),
    hearingDate: date("hearing_date"),
    sourceUrl: text("source_url").notNull().default(""),
    sourceId: text("source_id").notNull().default(""),
    notes: text("notes").notNull().default(""),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    ...sourceColumns,
    ...timestamps,
  },
  (table) => [
    uniqueIndex("uq_legislation_items_sheet_row").on(table.sourceSpreadsheetId, table.sourceTabName, table.sourceRowNumber),
    index("ix_legislation_items_status_hearing").on(table.status, table.hearingDate),
    index("ix_legislation_items_bill").on(table.billNumber),
  ],
);

export const budgetWatchItems = pgTable(
  "budget_watch_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    legacyId: integer("legacy_id"),
    department: text("department").notNull().default(""),
    lineItem: text("line_item").notNull().default(""),
    fiscalYear: text("fiscal_year").notNull().default(""),
    concern: text("concern").notNull().default(""),
    status: text("status").notNull().default("watching"),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    ...sourceColumns,
    ...timestamps,
  },
  (table) => [uniqueIndex("uq_budget_watch_items_sheet_row").on(table.sourceSpreadsheetId, table.sourceTabName, table.sourceRowNumber)],
);

export const officeActions = pgTable(
  "office_actions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    legacyId: integer("legacy_id"),
    title: text("title").notNull(),
    actionType: text("action_type").notNull().default("follow_up"),
    status: text("status").notNull().default("draft"),
    priority: text("priority").notNull().default("normal"),
    owner: text("owner").notNull().default(""),
    dueAt: timestamp("due_at", { withTimezone: true }),
    sourceType: text("source_type").notNull().default(""),
    sourceId: text("source_id").notNull().default(""),
    notes: text("notes").notNull().default(""),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    ...sourceColumns,
    ...timestamps,
  },
  (table) => [
    uniqueIndex("uq_office_actions_sheet_row").on(table.sourceSpreadsheetId, table.sourceTabName, table.sourceRowNumber),
    index("ix_office_actions_status_due").on(table.status, table.dueAt),
  ],
);

export const sourceConnections = pgTable(
  "source_connections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    legacyId: integer("legacy_id"),
    name: text("name").notNull(),
    sourceType: text("source_type").notNull().default(""),
    url: text("url").notNull().default(""),
    enabled: boolean("enabled").notNull().default(true),
    lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
    status: text("status").notNull().default("not_configured"),
    notes: text("notes").notNull().default(""),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    ...sourceColumns,
    ...timestamps,
  },
  (table) => [uniqueIndex("uq_source_connections_sheet_row").on(table.sourceSpreadsheetId, table.sourceTabName, table.sourceRowNumber)],
);

export const staffUsers = pgTable(
  "staff_users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    legacyId: integer("legacy_id"),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    role: text("role").notNull(),
    title: text("title").notNull().default(""),
    isActive: boolean("is_active").notNull().default(true),
    notes: text("notes").notNull().default(""),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    ...sourceColumns,
    ...timestamps,
  },
  (table) => [
    uniqueIndex("uq_staff_users_email").on(table.email),
    uniqueIndex("uq_staff_users_sheet_row").on(table.sourceSpreadsheetId, table.sourceTabName, table.sourceRowNumber),
  ],
);

export const documentRecords = pgTable(
  "document_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    legacyId: integer("legacy_id"),
    title: text("title").notNull(),
    folder: text("folder").notNull().default(""),
    fileName: text("file_name").notNull().default(""),
    docType: text("doc_type").notNull().default(""),
    status: text("status").notNull().default("new"),
    notes: text("notes").notNull().default(""),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    ...sourceColumns,
    ...timestamps,
  },
  (table) => [uniqueIndex("uq_document_records_sheet_row").on(table.sourceSpreadsheetId, table.sourceTabName, table.sourceRowNumber)],
);

export const lookupValues = pgTable(
  "lookup_values",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    lookupType: text("lookup_type").notNull(),
    value: text("value").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    sourceSpreadsheetId: text("source_spreadsheet_id").notNull(),
    sourceTabName: text("source_tab_name").notNull().default("Lookups"),
    sourceRowNumber: integer("source_row_number"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("uq_lookup_values_type_value").on(table.lookupType, table.value)],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actor: text("actor").notNull().default("system"),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull().default(""),
    detail: jsonb("detail").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    source: text("source").notNull().default("wardos"),
    sourceSpreadsheetId: text("source_spreadsheet_id"),
    sourceTabName: text("source_tab_name"),
    sourceRowNumber: integer("source_row_number"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("ix_audit_logs_actor_created").on(table.actor, table.createdAt),
    index("ix_audit_logs_entity").on(table.entityType, table.entityId),
  ],
);

export const constituentRelations = relations(constituents, ({ many }) => ({
  cases: many(constituentCases),
}));

export const caseRelations = relations(constituentCases, ({ one }) => ({
  constituent: one(constituents, {
    fields: [constituentCases.constituentId],
    references: [constituents.id],
  }),
}));

