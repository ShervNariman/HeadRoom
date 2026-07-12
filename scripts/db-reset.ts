import "dotenv/config";
import postgres from "postgres";
import { databaseUrl } from "@/lib/db/client";
import { runMigrations } from "@/lib/db/migrations";

if (process.env.NODE_ENV === "production") {
  throw new Error("Database reset is disabled in production.");
}

if (process.env.HEADROOM_ALLOW_DATABASE_RESET !== "true") {
  throw new Error("Set HEADROOM_ALLOW_DATABASE_RESET=true to reset a development database.");
}

const client = postgres(databaseUrl(), { max: 1, prepare: false });
try {
  await client.unsafe("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
} finally {
  await client.end({ timeout: 5 });
}

await runMigrations();
console.log("Development database reset and migrated.");
