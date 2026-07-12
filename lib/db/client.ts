import "server-only";

import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/lib/db/schema";

export type HeadroomDatabase = PostgresJsDatabase<typeof schema>;

type PostgresClient = ReturnType<typeof postgres>;

let client: PostgresClient | undefined;
let database: HeadroomDatabase | undefined;

function positiveInteger(value: string | undefined, fallback: number) {
  const parsed = value ? Number.parseInt(value, 10) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function databaseUrl() {
  const value = process.env.DATABASE_URL ?? process.env.TEST_DATABASE_URL;
  if (!value) {
    throw new Error("DATABASE_URL is required for PostgreSQL storage.");
  }
  return value;
}

export function getSqlClient(): PostgresClient {
  if (!client) {
    client = postgres(databaseUrl(), {
      max: positiveInteger(process.env.DATABASE_POOL_SIZE, 5),
      idle_timeout: positiveInteger(process.env.DATABASE_IDLE_TIMEOUT_SECONDS, 20),
      connect_timeout: positiveInteger(process.env.DATABASE_CONNECT_TIMEOUT_SECONDS, 10),
      prepare: false,
    });
  }
  return client;
}

export function getDatabase(): HeadroomDatabase {
  if (!database) {
    database = drizzle(getSqlClient(), { schema });
  }
  return database;
}

export async function closeDatabase() {
  if (client) {
    await client.end({ timeout: 5 });
  }
  client = undefined;
  database = undefined;
}
