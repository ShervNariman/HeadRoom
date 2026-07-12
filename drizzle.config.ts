import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL ?? process.env.TEST_DATABASE_URL;

if (!url) {
  throw new Error("DATABASE_URL or TEST_DATABASE_URL is required for Drizzle commands.");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
