import "server-only";

export type StorageAdapter = "file" | "postgres";

export type RuntimeConfig = {
  environment: "development" | "test" | "production";
  version: string;
  storageAdapter: StorageAdapter;
  databaseConfigured: boolean;
  privateAccessConfigured: boolean;
  ingestionConfigured: boolean;
  openAIConfigured: boolean;
};

function environment(): RuntimeConfig["environment"] {
  if (process.env.NODE_ENV === "production") return "production";
  if (process.env.NODE_ENV === "test") return "test";
  return "development";
}

export function getRuntimeConfig(): RuntimeConfig {
  const currentEnvironment = environment();
  const requestedAdapter =
    process.env.HEADROOM_STORAGE_DRIVER?.trim() ||
    (currentEnvironment === "production" ? "postgres" : "file");

  if (requestedAdapter !== "file" && requestedAdapter !== "postgres") {
    throw new Error(`Unsupported HEADROOM_STORAGE_DRIVER: ${requestedAdapter}`);
  }

  if (currentEnvironment === "production" && requestedAdapter === "file") {
    throw new Error("The file storage adapter is not supported in production.");
  }

  const databaseConfigured = Boolean(process.env.DATABASE_URL ?? process.env.TEST_DATABASE_URL);
  if (requestedAdapter === "postgres" && !databaseConfigured) {
    throw new Error("DATABASE_URL is required when PostgreSQL storage is selected.");
  }

  return {
    environment: currentEnvironment,
    version: process.env.npm_package_version || "0.4.0",
    storageAdapter: requestedAdapter,
    databaseConfigured,
    privateAccessConfigured: Boolean(process.env.HEADROOM_ACCESS_TOKEN),
    ingestionConfigured: Boolean(process.env.HEADROOM_INGEST_TOKEN),
    openAIConfigured: Boolean(process.env.OPENAI_ADMIN_KEY),
  };
}
