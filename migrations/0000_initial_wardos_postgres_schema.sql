CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor" text DEFAULT 'system' NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text DEFAULT '' NOT NULL,
	"detail" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"source" text DEFAULT 'wardos' NOT NULL,
	"source_spreadsheet_id" text,
	"source_tab_name" text,
	"source_row_number" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budget_watch_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"legacy_id" integer,
	"department" text DEFAULT '' NOT NULL,
	"line_item" text DEFAULT '' NOT NULL,
	"fiscal_year" text DEFAULT '' NOT NULL,
	"concern" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'watching' NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"source_spreadsheet_id" text NOT NULL,
	"source_tab_name" text NOT NULL,
	"source_row_number" integer,
	"source_row_hash" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "constituent_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"legacy_id" integer,
	"constituent_id" uuid,
	"constituent_name" text NOT NULL,
	"address_line" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"topic" text NOT NULL,
	"category" text DEFAULT '' NOT NULL,
	"department" text DEFAULT '' NOT NULL,
	"assigned_to" text DEFAULT '' NOT NULL,
	"ward" text DEFAULT '' NOT NULL,
	"source" text DEFAULT 'google_sheet' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"latitude" numeric,
	"longitude" numeric,
	"due_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"source_spreadsheet_id" text NOT NULL,
	"source_tab_name" text NOT NULL,
	"source_row_number" integer,
	"source_row_hash" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "constituents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"legacy_id" integer,
	"voter_id" text,
	"first_name" text DEFAULT '' NOT NULL,
	"last_name" text DEFAULT '' NOT NULL,
	"full_name" text NOT NULL,
	"street_no" text DEFAULT '' NOT NULL,
	"street" text DEFAULT '' NOT NULL,
	"apt" text DEFAULT '' NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	"state" text DEFAULT '' NOT NULL,
	"zip_code" text DEFAULT '' NOT NULL,
	"ward" text DEFAULT '' NOT NULL,
	"subgroup" text DEFAULT '' NOT NULL,
	"voter_status" text DEFAULT '' NOT NULL,
	"mailin_request_date" date,
	"mailin_sent_date" date,
	"mailin_received_date" date,
	"days_to_return" integer,
	"source_file" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"source_spreadsheet_id" text NOT NULL,
	"source_tab_name" text NOT NULL,
	"source_row_number" integer,
	"source_row_hash" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "development_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"legacy_id" integer,
	"name" text NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"project_type" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'tracking' NOT NULL,
	"board" text DEFAULT '' NOT NULL,
	"latitude" numeric,
	"longitude" numeric,
	"notes" text DEFAULT '' NOT NULL,
	"source_url" text DEFAULT '' NOT NULL,
	"source_id" text DEFAULT '' NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"source_spreadsheet_id" text NOT NULL,
	"source_tab_name" text NOT NULL,
	"source_row_number" integer,
	"source_row_hash" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "document_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"legacy_id" integer,
	"title" text NOT NULL,
	"folder" text DEFAULT '' NOT NULL,
	"file_name" text DEFAULT '' NOT NULL,
	"doc_type" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"source_spreadsheet_id" text NOT NULL,
	"source_tab_name" text NOT NULL,
	"source_row_number" integer,
	"source_row_hash" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"legacy_id" integer,
	"title" text NOT NULL,
	"starts_at" timestamp with time zone,
	"location" text DEFAULT '' NOT NULL,
	"event_type" text DEFAULT 'event' NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"source_url" text DEFAULT '' NOT NULL,
	"source_id" text DEFAULT '' NOT NULL,
	"source_spreadsheet_id" text NOT NULL,
	"source_tab_name" text NOT NULL,
	"source_row_number" integer,
	"source_row_hash" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "legislation_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"legacy_id" integer,
	"bill_number" text DEFAULT '' NOT NULL,
	"title" text NOT NULL,
	"status" text DEFAULT 'tracking' NOT NULL,
	"hearing_date" date,
	"source_url" text DEFAULT '' NOT NULL,
	"source_id" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"source_spreadsheet_id" text NOT NULL,
	"source_tab_name" text NOT NULL,
	"source_row_number" integer,
	"source_row_hash" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "lookup_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lookup_type" text NOT NULL,
	"value" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"source_spreadsheet_id" text NOT NULL,
	"source_tab_name" text DEFAULT 'Lookups' NOT NULL,
	"source_row_number" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_mentions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"legacy_id" integer,
	"source" text DEFAULT '' NOT NULL,
	"source_type" text DEFAULT 'news' NOT NULL,
	"headline" text NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"url" text DEFAULT '' NOT NULL,
	"sentiment" text DEFAULT 'neutral' NOT NULL,
	"topic" text DEFAULT '' NOT NULL,
	"geographic_tag" text DEFAULT '' NOT NULL,
	"engagement_score" integer DEFAULT 0 NOT NULL,
	"latitude" numeric,
	"longitude" numeric,
	"published_at" timestamp with time zone,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"source_spreadsheet_id" text NOT NULL,
	"source_tab_name" text NOT NULL,
	"source_row_number" integer,
	"source_row_hash" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "office_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"legacy_id" integer,
	"title" text NOT NULL,
	"action_type" text DEFAULT 'follow_up' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"owner" text DEFAULT '' NOT NULL,
	"due_at" timestamp with time zone,
	"source_type" text DEFAULT '' NOT NULL,
	"source_id" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"source_spreadsheet_id" text NOT NULL,
	"source_tab_name" text NOT NULL,
	"source_row_number" integer,
	"source_row_hash" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "public_safety_incidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"legacy_id" integer,
	"incident_type" text DEFAULT 'incident' NOT NULL,
	"category" text DEFAULT 'other' NOT NULL,
	"title" text NOT NULL,
	"location" text DEFAULT '' NOT NULL,
	"occurred_at" timestamp with time zone,
	"status" text DEFAULT 'reported' NOT NULL,
	"severity" text DEFAULT 'medium' NOT NULL,
	"ward" text DEFAULT 'South Ward' NOT NULL,
	"latitude" numeric,
	"longitude" numeric,
	"source_file" text DEFAULT '' NOT NULL,
	"source_url" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"source_spreadsheet_id" text NOT NULL,
	"source_tab_name" text NOT NULL,
	"source_row_number" integer,
	"source_row_hash" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sheet_import_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"spreadsheet_id" text NOT NULL,
	"mode" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"status" text DEFAULT 'running' NOT NULL,
	"tabs_found" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"summary" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sheet_source_rows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"import_run_id" uuid,
	"spreadsheet_id" text NOT NULL,
	"tab_name" text NOT NULL,
	"sheet_row_number" integer NOT NULL,
	"normalized_tab_name" text NOT NULL,
	"row_hash" text NOT NULL,
	"raw_values" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"mapped_table" text,
	"mapped_record_key" text,
	"status" text DEFAULT 'seen' NOT NULL,
	"error" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"legacy_id" integer,
	"name" text NOT NULL,
	"source_type" text DEFAULT '' NOT NULL,
	"url" text DEFAULT '' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"last_sync_at" timestamp with time zone,
	"status" text DEFAULT 'not_configured' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"source_spreadsheet_id" text NOT NULL,
	"source_tab_name" text NOT NULL,
	"source_row_number" integer,
	"source_row_hash" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "staff_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"legacy_id" integer,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"source_spreadsheet_id" text NOT NULL,
	"source_tab_name" text NOT NULL,
	"source_row_number" integer,
	"source_row_hash" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "wardos_memory_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"memory_key" text NOT NULL,
	"category" text NOT NULL,
	"source_table" text NOT NULL,
	"source_id" text NOT NULL,
	"title" text NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"status" text DEFAULT '' NOT NULL,
	"priority" text DEFAULT '' NOT NULL,
	"owner" text DEFAULT '' NOT NULL,
	"event_date" timestamp with time zone,
	"url" text DEFAULT '' NOT NULL,
	"tags" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"sheet_name" text DEFAULT '' NOT NULL,
	"sheet_row_hash" text DEFAULT '' NOT NULL,
	"last_seen_at" timestamp with time zone,
	"source_spreadsheet_id" text NOT NULL,
	"source_tab_name" text NOT NULL,
	"source_row_number" integer,
	"source_row_hash" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "constituent_cases" ADD CONSTRAINT "constituent_cases_constituent_id_constituents_id_fk" FOREIGN KEY ("constituent_id") REFERENCES "public"."constituents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheet_source_rows" ADD CONSTRAINT "sheet_source_rows_import_run_id_sheet_import_runs_id_fk" FOREIGN KEY ("import_run_id") REFERENCES "public"."sheet_import_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ix_audit_logs_actor_created" ON "audit_logs" USING btree ("actor","created_at");--> statement-breakpoint
CREATE INDEX "ix_audit_logs_entity" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_budget_watch_items_sheet_row" ON "budget_watch_items" USING btree ("source_spreadsheet_id","source_tab_name","source_row_number");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_constituent_cases_sheet_row" ON "constituent_cases" USING btree ("source_spreadsheet_id","source_tab_name","source_row_number");--> statement-breakpoint
CREATE INDEX "ix_constituent_cases_status_created" ON "constituent_cases" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "ix_constituent_cases_constituent" ON "constituent_cases" USING btree ("constituent_id");--> statement-breakpoint
CREATE INDEX "ix_constituent_cases_search" ON "constituent_cases" USING gin (to_tsvector('english', coalesce("constituent_name", '') || ' ' || coalesce("address_line", '') || ' ' || coalesce("topic", '') || ' ' || coalesce("notes", '')));--> statement-breakpoint
CREATE UNIQUE INDEX "uq_constituents_voter_id" ON "constituents" USING btree ("voter_id") WHERE "constituents"."voter_id" is not null and "constituents"."voter_id" <> '';--> statement-breakpoint
CREATE UNIQUE INDEX "uq_constituents_sheet_row" ON "constituents" USING btree ("source_spreadsheet_id","source_tab_name","source_row_number");--> statement-breakpoint
CREATE INDEX "ix_constituents_ward_subgroup" ON "constituents" USING btree ("ward","subgroup");--> statement-breakpoint
CREATE INDEX "ix_constituents_street_lookup" ON "constituents" USING btree ("street","street_no","zip_code");--> statement-breakpoint
CREATE INDEX "ix_constituents_search" ON "constituents" USING gin (to_tsvector('english', coalesce("full_name", '') || ' ' || coalesce("street", '') || ' ' || coalesce("notes", '') || ' ' || coalesce("voter_id", '')));--> statement-breakpoint
CREATE UNIQUE INDEX "uq_development_projects_sheet_row" ON "development_projects" USING btree ("source_spreadsheet_id","source_tab_name","source_row_number");--> statement-breakpoint
CREATE INDEX "ix_development_projects_status_created" ON "development_projects" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_document_records_sheet_row" ON "document_records" USING btree ("source_spreadsheet_id","source_tab_name","source_row_number");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_events_sheet_row" ON "events" USING btree ("source_spreadsheet_id","source_tab_name","source_row_number");--> statement-breakpoint
CREATE INDEX "ix_events_status_starts" ON "events" USING btree ("status","starts_at");--> statement-breakpoint
CREATE INDEX "ix_events_source_id" ON "events" USING btree ("source_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_legislation_items_sheet_row" ON "legislation_items" USING btree ("source_spreadsheet_id","source_tab_name","source_row_number");--> statement-breakpoint
CREATE INDEX "ix_legislation_items_status_hearing" ON "legislation_items" USING btree ("status","hearing_date");--> statement-breakpoint
CREATE INDEX "ix_legislation_items_bill" ON "legislation_items" USING btree ("bill_number");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_lookup_values_type_value" ON "lookup_values" USING btree ("lookup_type","value");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_media_mentions_sheet_row" ON "media_mentions" USING btree ("source_spreadsheet_id","source_tab_name","source_row_number");--> statement-breakpoint
CREATE INDEX "ix_media_mentions_source_published" ON "media_mentions" USING btree ("source_type","published_at");--> statement-breakpoint
CREATE INDEX "ix_media_mentions_sentiment_topic" ON "media_mentions" USING btree ("sentiment","topic");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_office_actions_sheet_row" ON "office_actions" USING btree ("source_spreadsheet_id","source_tab_name","source_row_number");--> statement-breakpoint
CREATE INDEX "ix_office_actions_status_due" ON "office_actions" USING btree ("status","due_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_public_safety_sheet_row" ON "public_safety_incidents" USING btree ("source_spreadsheet_id","source_tab_name","source_row_number");--> statement-breakpoint
CREATE INDEX "ix_public_safety_status_occurred" ON "public_safety_incidents" USING btree ("status","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_sheet_source_row_identity" ON "sheet_source_rows" USING btree ("spreadsheet_id","tab_name","sheet_row_number","row_hash");--> statement-breakpoint
CREATE INDEX "ix_sheet_source_rows_tab_table" ON "sheet_source_rows" USING btree ("tab_name","mapped_table");--> statement-breakpoint
CREATE INDEX "ix_sheet_source_rows_mapping" ON "sheet_source_rows" USING btree ("mapped_table","mapped_record_key");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_source_connections_sheet_row" ON "source_connections" USING btree ("source_spreadsheet_id","source_tab_name","source_row_number");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_staff_users_email" ON "staff_users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_staff_users_sheet_row" ON "staff_users" USING btree ("source_spreadsheet_id","source_tab_name","source_row_number");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_wardos_memory_items_memory_key" ON "wardos_memory_items" USING btree ("memory_key");--> statement-breakpoint
CREATE INDEX "ix_wardos_memory_items_category_updated" ON "wardos_memory_items" USING btree ("category","updated_at");--> statement-breakpoint
CREATE INDEX "ix_wardos_memory_items_source" ON "wardos_memory_items" USING btree ("source_table","source_id");--> statement-breakpoint
CREATE INDEX "ix_wardos_memory_items_payload_gin" ON "wardos_memory_items" USING gin ("payload");--> statement-breakpoint
CREATE INDEX "ix_wardos_memory_items_tags_gin" ON "wardos_memory_items" USING gin ("tags");