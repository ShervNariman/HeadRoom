import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const providerConnectionStatus = pgEnum("provider_connection_status", [
  "disconnected",
  "healthy",
  "degraded",
  "stale",
]);

export const metricKind = pgEnum("metric_kind", [
  "counter",
  "gauge",
  "rate",
  "monetary",
  "cumulative",
]);

export const syncRunStatus = pgEnum("sync_run_status", [
  "queued",
  "running",
  "succeeded",
  "failed",
  "canceled",
]);

export const workspaces = pgTable(
  "workspaces",
  {
    id: uuid("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("workspaces_slug_unique").on(table.slug)],
);

export const providerConnections = pgTable(
  "provider_connections",
  {
    id: uuid("id").primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    providerKey: text("provider_key").notNull(),
    displayName: text("display_name").notNull(),
    status: providerConnectionStatus("status").default("disconnected").notNull(),
    credentialCiphertext: text("credential_ciphertext"),
    credentialKeyVersion: integer("credential_key_version"),
    lastAttemptedSyncAt: timestamp("last_attempted_sync_at", { withTimezone: true }),
    lastSuccessfulSyncAt: timestamp("last_successful_sync_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("provider_connections_workspace_name_unique").on(
      table.workspaceId,
      table.providerKey,
      table.displayName,
    ),
    index("provider_connections_workspace_status_idx").on(table.workspaceId, table.status),
  ],
);

export const metricDefinitions = pgTable(
  "metric_definitions",
  {
    id: uuid("id").primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    providerConnectionId: uuid("provider_connection_id").references(() => providerConnections.id, {
      onDelete: "set null",
    }),
    provider: text("provider").notNull(),
    metric: text("metric").notNull(),
    unit: text("unit").notNull(),
    kind: metricKind("kind").default("cumulative").notNull(),
    resetPeriod: text("reset_period"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("metric_definitions_workspace_metric_unique").on(
      table.workspaceId,
      table.provider,
      table.metric,
      table.unit,
    ),
    index("metric_definitions_connection_idx").on(table.providerConnectionId),
  ],
);

export const usageSnapshots = pgTable(
  "usage_snapshots",
  {
    id: uuid("id").primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    metricDefinitionId: uuid("metric_definition_id")
      .notNull()
      .references(() => metricDefinitions.id, { onDelete: "cascade" }),
    idempotencyKey: text("idempotency_key").notNull(),
    usage: numeric("usage", { precision: 30, scale: 10 }).notNull(),
    limit: numeric("limit", { precision: 30, scale: 10 }),
    spend: numeric("spend", { precision: 30, scale: 10 }),
    budget: numeric("budget", { precision: 30, scale: 10 }),
    currency: varchar("currency", { length: 6 }),
    project: text("project"),
    source: text("source").notNull(),
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("usage_snapshots_workspace_idempotency_unique").on(
      table.workspaceId,
      table.idempotencyKey,
    ),
    index("usage_snapshots_metric_captured_idx").on(
      table.metricDefinitionId,
      table.capturedAt,
    ),
    index("usage_snapshots_workspace_captured_idx").on(table.workspaceId, table.capturedAt),
  ],
);

export const syncRuns = pgTable(
  "sync_runs",
  {
    id: uuid("id").primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    providerConnectionId: uuid("provider_connection_id")
      .notNull()
      .references(() => providerConnections.id, { onDelete: "cascade" }),
    idempotencyKey: text("idempotency_key").notNull(),
    status: syncRunStatus("status").default("queued").notNull(),
    attemptCount: integer("attempt_count").default(0).notNull(),
    leaseOwner: text("lease_owner"),
    leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true }),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    nextRetryAt: timestamp("next_retry_at", { withTimezone: true }),
    errorCategory: text("error_category"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("sync_runs_workspace_idempotency_unique").on(
      table.workspaceId,
      table.idempotencyKey,
    ),
    index("sync_runs_status_retry_idx").on(table.status, table.nextRetryAt),
    index("sync_runs_lease_idx").on(table.leaseExpiresAt),
    index("sync_runs_connection_created_idx").on(table.providerConnectionId, table.createdAt),
  ],
);

export const alertPolicies = pgTable(
  "alert_policies",
  {
    id: uuid("id").primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    metricDefinitionId: uuid("metric_definition_id").references(() => metricDefinitions.id, {
      onDelete: "cascade",
    }),
    name: text("name").notNull(),
    kind: text("kind").notNull(),
    threshold: numeric("threshold", { precision: 30, scale: 10 }),
    windowSeconds: integer("window_seconds"),
    enabled: boolean("enabled").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("alert_policies_workspace_enabled_idx").on(table.workspaceId, table.enabled)],
);

export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    actorType: text("actor_type").notNull(),
    actorId: text("actor_id"),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id"),
    metadata: jsonb("metadata").default(sql`'{}'::jsonb`).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("audit_events_workspace_created_idx").on(table.workspaceId, table.createdAt)],
);
