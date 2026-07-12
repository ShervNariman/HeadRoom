import "server-only";

import { createHash } from "node:crypto";
import type { HeadroomSnapshot } from "@/lib/integrations";

function normalizedNumber(value: number | undefined) {
  return value === undefined ? "" : Number(value).toString();
}

export function snapshotIdempotencyKey(snapshot: HeadroomSnapshot) {
  if (snapshot.idempotencyKey) return snapshot.idempotencyKey;

  const material = [
    snapshot.provider.trim().toLowerCase(),
    snapshot.metric.trim().toLowerCase(),
    snapshot.unit.trim().toLowerCase(),
    snapshot.source,
    new Date(snapshot.capturedAt).toISOString(),
    normalizedNumber(snapshot.usage),
    normalizedNumber(snapshot.limit),
    normalizedNumber(snapshot.spend),
    normalizedNumber(snapshot.budget),
    snapshot.currency?.trim().toUpperCase() ?? "",
    snapshot.project?.trim() ?? "",
  ].join("\u001f");

  return createHash("sha256").update(material).digest("hex");
}
