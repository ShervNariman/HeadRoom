CREATE TYPE provider_connection_status AS ENUM ('disconnected', 'healthy', 'degraded', 'stale');
CREATE TYPE metric_kind AS ENUM ('counter', 'gauge', 'rate', 'monetary', 'cumulative');
CREATE TYPE sync_run_status AS ENUM ('queued', 'running', 'succeeded', 'failed', 'canceled');

CREATE TABLE workspaces (
  id uuid PRIMARY KEY,
  slug text NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX workspaces_slug_unique ON workspaces (slug);

CREATE TABLE provider_connections (
  id uuid PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  provider_key text NOT NULL,
  display_name text NOT NULL,
  status provider_connection_status NOT NULL DEFAULT 'disconnected',
  credential_ciphertext text,
  credential_key_version integer,
  last_attempted_sync_at timestamptz,
  last_successful_sync_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT provider_connections_credential_version_check CHECK (
    credential_ciphertext IS NULL OR credential_key_version IS NOT NULL
  )
);

CREATE UNIQUE INDEX provider_connections_workspace_name_unique
  ON provider_connections (workspace_id, provider_key, display_name);
CREATE INDEX provider_connections_workspace_status_idx
  ON provider_connections (workspace_id, status);

CREATE TABLE metric_definitions (
  id uuid PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  provider_connection_id uuid REFERENCES provider_connections(id) ON DELETE SET NULL,
  provider text NOT NULL,
  metric text NOT NULL,
  unit text NOT NULL,
  kind metric_kind NOT NULL DEFAULT 'cumulative',
  reset_period text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX metric_definitions_workspace_metric_unique
  ON metric_definitions (workspace_id, provider, metric, unit);
CREATE INDEX metric_definitions_connection_idx
  ON metric_definitions (provider_connection_id);

CREATE TABLE usage_snapshots (
  id uuid PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  metric_definition_id uuid NOT NULL REFERENCES metric_definitions(id) ON DELETE CASCADE,
  idempotency_key text NOT NULL,
  usage numeric(30, 10) NOT NULL,
  "limit" numeric(30, 10),
  spend numeric(30, 10),
  budget numeric(30, 10),
  currency varchar(6),
  project text,
  source text NOT NULL,
  captured_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT usage_snapshots_usage_nonnegative CHECK (usage >= 0),
  CONSTRAINT usage_snapshots_limit_nonnegative CHECK ("limit" IS NULL OR "limit" >= 0),
  CONSTRAINT usage_snapshots_spend_nonnegative CHECK (spend IS NULL OR spend >= 0),
  CONSTRAINT usage_snapshots_budget_nonnegative CHECK (budget IS NULL OR budget >= 0)
);

CREATE UNIQUE INDEX usage_snapshots_workspace_idempotency_unique
  ON usage_snapshots (workspace_id, idempotency_key);
CREATE INDEX usage_snapshots_metric_captured_idx
  ON usage_snapshots (metric_definition_id, captured_at);
CREATE INDEX usage_snapshots_workspace_captured_idx
  ON usage_snapshots (workspace_id, captured_at);

CREATE TABLE sync_runs (
  id uuid PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  provider_connection_id uuid NOT NULL REFERENCES provider_connections(id) ON DELETE CASCADE,
  idempotency_key text NOT NULL,
  status sync_run_status NOT NULL DEFAULT 'queued',
  attempt_count integer NOT NULL DEFAULT 0,
  lease_owner text,
  lease_expires_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  next_retry_at timestamptz,
  error_category text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sync_runs_attempt_count_nonnegative CHECK (attempt_count >= 0)
);

CREATE UNIQUE INDEX sync_runs_workspace_idempotency_unique
  ON sync_runs (workspace_id, idempotency_key);
CREATE INDEX sync_runs_status_retry_idx ON sync_runs (status, next_retry_at);
CREATE INDEX sync_runs_lease_idx ON sync_runs (lease_expires_at);
CREATE INDEX sync_runs_connection_created_idx
  ON sync_runs (provider_connection_id, created_at);

CREATE TABLE alert_policies (
  id uuid PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  metric_definition_id uuid REFERENCES metric_definitions(id) ON DELETE CASCADE,
  name text NOT NULL,
  kind text NOT NULL,
  threshold numeric(30, 10),
  window_seconds integer,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT alert_policies_window_positive CHECK (
    window_seconds IS NULL OR window_seconds > 0
  )
);

CREATE INDEX alert_policies_workspace_enabled_idx
  ON alert_policies (workspace_id, enabled);

CREATE TABLE audit_events (
  id uuid PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  actor_type text NOT NULL,
  actor_id text,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_events_workspace_created_idx
  ON audit_events (workspace_id, created_at);

INSERT INTO workspaces (id, slug, name)
VALUES ('00000000-0000-4000-8000-000000000001', 'default', 'Default workspace')
ON CONFLICT (id) DO NOTHING;
