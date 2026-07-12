export type SnapshotSource = "manual" | "webhook" | "openai";

export type HeadroomSnapshot = {
  id: string;
  idempotencyKey?: string;
  provider: string;
  metric: string;
  usage: number;
  unit: string;
  limit?: number;
  spend?: number;
  budget?: number;
  currency?: string;
  project?: string;
  source: SnapshotSource;
  capturedAt: string;
};

export type SnapshotInput = {
  provider: string;
  metric?: string;
  usage: number;
  unit?: string;
  limit?: number;
  spend?: number;
  budget?: number;
  currency?: string;
  project?: string;
  timestamp?: string;
  idempotencyKey?: string;
};

function optionalFiniteNumber(value: unknown, field: string) {
  if (value === undefined || value === null || value === "") return undefined;
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new Error(`${field} must be a non-negative number.`);
  }
  return number;
}

export function normalizeSnapshotInput(
  input: unknown,
  source: SnapshotSource,
): HeadroomSnapshot {
  if (!input || typeof input !== "object") {
    throw new Error("A JSON object is required.");
  }

  const value = input as Record<string, unknown>;
  const provider = String(value.provider ?? "").trim();
  const metric = String(value.metric ?? "usage").trim();
  const unit = String(value.unit ?? "units").trim();
  const usage = optionalFiniteNumber(value.usage, "usage");

  if (!provider) throw new Error("provider is required.");
  if (!metric) throw new Error("metric is required.");
  if (!unit) throw new Error("unit is required.");
  if (usage === undefined) throw new Error("usage is required.");

  const timestamp = value.timestamp ? new Date(String(value.timestamp)) : new Date();
  if (Number.isNaN(timestamp.getTime())) throw new Error("timestamp must be a valid date.");

  const suppliedIdempotencyKey = String(value.idempotencyKey ?? "").trim();

  return {
    id: crypto.randomUUID(),
    idempotencyKey: suppliedIdempotencyKey ? suppliedIdempotencyKey.slice(0, 160) : undefined,
    provider: provider.slice(0, 80),
    metric: metric.slice(0, 80),
    usage,
    unit: unit.slice(0, 40),
    limit: optionalFiniteNumber(value.limit, "limit"),
    spend: optionalFiniteNumber(value.spend, "spend"),
    budget: optionalFiniteNumber(value.budget, "budget"),
    currency: value.currency ? String(value.currency).toUpperCase().slice(0, 6) : undefined,
    project: value.project ? String(value.project).slice(0, 80) : undefined,
    source,
    capturedAt: timestamp.toISOString(),
  };
}
