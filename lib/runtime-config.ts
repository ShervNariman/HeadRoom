import "server-only";

export type RuntimeConfig = {
  environment: "development" | "test" | "production";
  version: string;
  storageAdapter: "file";
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
  const requestedAdapter = process.env.HEADROOM_STORAGE_DRIVER?.trim() || "file";
  if (requestedAdapter !== "file") {
    throw new Error(`Unsupported HEADROOM_STORAGE_DRIVER: ${requestedAdapter}`);
  }

  return {
    environment: environment(),
    version: process.env.npm_package_version || "0.3.0",
    storageAdapter: "file",
    privateAccessConfigured: Boolean(process.env.HEADROOM_ACCESS_TOKEN),
    ingestionConfigured: Boolean(process.env.HEADROOM_INGEST_TOKEN),
    openAIConfigured: Boolean(process.env.OPENAI_ADMIN_KEY),
  };
}
