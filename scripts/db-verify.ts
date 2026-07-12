import "dotenv/config";
import postgres from "postgres";
import { databaseUrl } from "@/lib/db/client";
import { runMigrations } from "@/lib/db/migrations";

const expectedTables = [
  "alert_policies",
  "audit_events",
  "headroom_schema_migrations",
  "metric_definitions",
  "provider_connections",
  "sync_runs",
  "usage_snapshots",
  "workspaces",
];

await runMigrations();
const client = postgres(databaseUrl(), { max: 1, prepare: false });

try {
  const rows = await client<{ table_name: string }[]>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;
  const present = new Set(rows.map((row) => row.table_name));
  const missing = expectedTables.filter((table) => !present.has(table));

  if (missing.length) {
    throw new Error(`Database verification failed; missing tables: ${missing.join(", ")}`);
  }

  const [workspace] = await client<{ count: number }[]>`
    SELECT count(*)::int AS count
    FROM workspaces
    WHERE id = '00000000-0000-4000-8000-000000000001'
  `;
  if (workspace?.count !== 1) {
    throw new Error("Database verification failed; default workspace is unavailable.");
  }

  console.log(`Database verification passed for ${expectedTables.length} required tables.`);
} finally {
  await client.end({ timeout: 5 });
}
