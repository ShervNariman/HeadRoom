import "server-only";

import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import postgres from "postgres";
import { databaseUrl } from "@/lib/db/client";

const MIGRATION_TABLE = "headroom_schema_migrations";

export type MigrationResult = {
  applied: string[];
  alreadyApplied: string[];
};

function checksum(content: string) {
  return createHash("sha256").update(content).digest("hex");
}

async function migrationFiles(directory: string) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && /^\d+_.+\.sql$/.test(entry.name))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

export async function runMigrations(options?: {
  url?: string;
  directory?: string;
}): Promise<MigrationResult> {
  const directory = options?.directory ?? path.join(process.cwd(), "drizzle");
  const client = postgres(options?.url ?? databaseUrl(), {
    max: 1,
    prepare: false,
    connect_timeout: 10,
  });

  const applied: string[] = [];
  const alreadyApplied: string[] = [];

  try {
    await client.unsafe(`
      CREATE TABLE IF NOT EXISTS ${MIGRATION_TABLE} (
        name text PRIMARY KEY,
        checksum text NOT NULL,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    const rows = await client<{ name: string; checksum: string }[]>`
      SELECT name, checksum
      FROM headroom_schema_migrations
      ORDER BY name
    `;
    const existing = new Map(rows.map((row) => [row.name, row.checksum]));

    for (const filename of await migrationFiles(directory)) {
      const content = await fs.readFile(path.join(directory, filename), "utf8");
      const currentChecksum = checksum(content);
      const recordedChecksum = existing.get(filename);

      if (recordedChecksum) {
        if (recordedChecksum !== currentChecksum) {
          throw new Error(`Migration ${filename} changed after it was applied.`);
        }
        alreadyApplied.push(filename);
        continue;
      }

      await client.begin(async (transaction) => {
        await transaction.unsafe(content);
        await transaction`
          INSERT INTO headroom_schema_migrations (name, checksum)
          VALUES (${filename}, ${currentChecksum})
        `;
      });
      applied.push(filename);
    }

    return { applied, alreadyApplied };
  } finally {
    await client.end({ timeout: 5 });
  }
}
