import "dotenv/config";
import postgres from "postgres";
import { databaseUrl } from "@/lib/db/client";
import { runMigrations } from "@/lib/db/migrations";

if (process.env.NODE_ENV === "production") {
  throw new Error("Sanitized seed data is intended for development and test environments only.");
}

await runMigrations();
const client = postgres(databaseUrl(), { max: 1, prepare: false });

try {
  await client.begin(async (transaction) => {
    await transaction`
      INSERT INTO metric_definitions (
        id,
        workspace_id,
        provider,
        metric,
        unit,
        kind
      ) VALUES (
        '00000000-0000-4000-8000-000000000101',
        '00000000-0000-4000-8000-000000000001',
        'Example API',
        'Monthly requests',
        'requests',
        'cumulative'
      )
      ON CONFLICT (workspace_id, provider, metric, unit) DO NOTHING
    `;

    await transaction`
      INSERT INTO usage_snapshots (
        id,
        workspace_id,
        metric_definition_id,
        idempotency_key,
        usage,
        "limit",
        spend,
        budget,
        currency,
        project,
        source,
        captured_at
      ) VALUES
        (
          '00000000-0000-4000-8000-000000000201',
          '00000000-0000-4000-8000-000000000001',
          '00000000-0000-4000-8000-000000000101',
          'seed-example-api-2026-01-01',
          2400,
          10000,
          12.50,
          50,
          'USD',
          'Example project',
          'manual',
          '2026-01-01T00:00:00Z'
        ),
        (
          '00000000-0000-4000-8000-000000000202',
          '00000000-0000-4000-8000-000000000001',
          '00000000-0000-4000-8000-000000000101',
          'seed-example-api-2026-01-02',
          3100,
          10000,
          16.25,
          50,
          'USD',
          'Example project',
          'manual',
          '2026-01-02T00:00:00Z'
        )
      ON CONFLICT (workspace_id, idempotency_key) DO NOTHING
    `;
  });

  console.log("Sanitized development seed data is ready.");
} finally {
  await client.end({ timeout: 5 });
}
