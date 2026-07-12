import "server-only";

import { and, asc, eq, sql } from "drizzle-orm";
import { DEFAULT_WORKSPACE_ID, DEFAULT_WORKSPACE_NAME, DEFAULT_WORKSPACE_SLUG } from "@/lib/db/constants";
import { getDatabase } from "@/lib/db/client";
import { metricDefinitions, usageSnapshots, workspaces } from "@/lib/db/schema";
import type { HeadroomSnapshot } from "@/lib/integrations";
import { snapshotIdempotencyKey } from "@/lib/storage/idempotency";
import type { SnapshotStore, StorageHealth } from "@/lib/storage/snapshot-store";

function decimal(value: number | undefined) {
  return value === undefined ? null : value.toString();
}

function numberOrUndefined(value: string | null) {
  return value === null ? undefined : Number(value);
}

async function ensureDefaultWorkspace() {
  const database = getDatabase();
  await database
    .insert(workspaces)
    .values({
      id: DEFAULT_WORKSPACE_ID,
      slug: DEFAULT_WORKSPACE_SLUG,
      name: DEFAULT_WORKSPACE_NAME,
    })
    .onConflictDoNothing({ target: workspaces.id });
}

async function metricDefinitionId(snapshot: HeadroomSnapshot) {
  const database = getDatabase();
  const predicate = and(
    eq(metricDefinitions.workspaceId, DEFAULT_WORKSPACE_ID),
    eq(metricDefinitions.provider, snapshot.provider),
    eq(metricDefinitions.metric, snapshot.metric),
    eq(metricDefinitions.unit, snapshot.unit),
  );

  const [existing] = await database
    .select({ id: metricDefinitions.id })
    .from(metricDefinitions)
    .where(predicate)
    .limit(1);
  if (existing) return existing.id;

  const candidateId = crypto.randomUUID();
  const [inserted] = await database
    .insert(metricDefinitions)
    .values({
      id: candidateId,
      workspaceId: DEFAULT_WORKSPACE_ID,
      provider: snapshot.provider,
      metric: snapshot.metric,
      unit: snapshot.unit,
      kind: snapshot.spend !== undefined ? "monetary" : "cumulative",
    })
    .onConflictDoNothing({
      target: [
        metricDefinitions.workspaceId,
        metricDefinitions.provider,
        metricDefinitions.metric,
        metricDefinitions.unit,
      ],
    })
    .returning({ id: metricDefinitions.id });
  if (inserted) return inserted.id;

  const [raced] = await database
    .select({ id: metricDefinitions.id })
    .from(metricDefinitions)
    .where(predicate)
    .limit(1);
  if (!raced) throw new Error("Unable to resolve metric definition.");
  return raced.id;
}

async function snapshotByIdempotencyKey(idempotencyKey: string) {
  const database = getDatabase();
  const [row] = await database
    .select({
      id: usageSnapshots.id,
      idempotencyKey: usageSnapshots.idempotencyKey,
      provider: metricDefinitions.provider,
      metric: metricDefinitions.metric,
      unit: metricDefinitions.unit,
      usage: usageSnapshots.usage,
      limit: usageSnapshots.limit,
      spend: usageSnapshots.spend,
      budget: usageSnapshots.budget,
      currency: usageSnapshots.currency,
      project: usageSnapshots.project,
      source: usageSnapshots.source,
      capturedAt: usageSnapshots.capturedAt,
    })
    .from(usageSnapshots)
    .innerJoin(metricDefinitions, eq(usageSnapshots.metricDefinitionId, metricDefinitions.id))
    .where(
      and(
        eq(usageSnapshots.workspaceId, DEFAULT_WORKSPACE_ID),
        eq(usageSnapshots.idempotencyKey, idempotencyKey),
      ),
    )
    .limit(1);

  if (!row) return undefined;
  return {
    id: row.id,
    idempotencyKey: row.idempotencyKey,
    provider: row.provider,
    metric: row.metric,
    usage: Number(row.usage),
    unit: row.unit,
    limit: numberOrUndefined(row.limit),
    spend: numberOrUndefined(row.spend),
    budget: numberOrUndefined(row.budget),
    currency: row.currency ?? undefined,
    project: row.project ?? undefined,
    source: row.source as HeadroomSnapshot["source"],
    capturedAt: row.capturedAt.toISOString(),
  } satisfies HeadroomSnapshot;
}

export class PostgresSnapshotStore implements SnapshotStore {
  readonly adapter = "postgres";

  async listSnapshots(): Promise<HeadroomSnapshot[]> {
    await ensureDefaultWorkspace();
    const database = getDatabase();
    const rows = await database
      .select({
        id: usageSnapshots.id,
        idempotencyKey: usageSnapshots.idempotencyKey,
        provider: metricDefinitions.provider,
        metric: metricDefinitions.metric,
        unit: metricDefinitions.unit,
        usage: usageSnapshots.usage,
        limit: usageSnapshots.limit,
        spend: usageSnapshots.spend,
        budget: usageSnapshots.budget,
        currency: usageSnapshots.currency,
        project: usageSnapshots.project,
        source: usageSnapshots.source,
        capturedAt: usageSnapshots.capturedAt,
      })
      .from(usageSnapshots)
      .innerJoin(metricDefinitions, eq(usageSnapshots.metricDefinitionId, metricDefinitions.id))
      .where(eq(usageSnapshots.workspaceId, DEFAULT_WORKSPACE_ID))
      .orderBy(asc(usageSnapshots.capturedAt), asc(usageSnapshots.id));

    return rows.map((row) => ({
      id: row.id,
      idempotencyKey: row.idempotencyKey,
      provider: row.provider,
      metric: row.metric,
      usage: Number(row.usage),
      unit: row.unit,
      limit: numberOrUndefined(row.limit),
      spend: numberOrUndefined(row.spend),
      budget: numberOrUndefined(row.budget),
      currency: row.currency ?? undefined,
      project: row.project ?? undefined,
      source: row.source as HeadroomSnapshot["source"],
      capturedAt: row.capturedAt.toISOString(),
    }));
  }

  async appendSnapshot(snapshot: HeadroomSnapshot): Promise<HeadroomSnapshot> {
    await ensureDefaultWorkspace();
    const database = getDatabase();
    const metricId = await metricDefinitionId(snapshot);
    const idempotencyKey = snapshotIdempotencyKey(snapshot);

    await database
      .insert(usageSnapshots)
      .values({
        id: snapshot.id,
        workspaceId: DEFAULT_WORKSPACE_ID,
        metricDefinitionId: metricId,
        idempotencyKey,
        usage: snapshot.usage.toString(),
        limit: decimal(snapshot.limit),
        spend: decimal(snapshot.spend),
        budget: decimal(snapshot.budget),
        currency: snapshot.currency,
        project: snapshot.project,
        source: snapshot.source,
        capturedAt: new Date(snapshot.capturedAt),
      })
      .onConflictDoNothing({
        target: [usageSnapshots.workspaceId, usageSnapshots.idempotencyKey],
      });

    const persisted = await snapshotByIdempotencyKey(idempotencyKey);
    if (!persisted) throw new Error("Snapshot persistence did not return a record.");
    return persisted;
  }

  async healthcheck(): Promise<StorageHealth> {
    try {
      await getDatabase().execute(sql`select 1`);
      return { ok: true, adapter: this.adapter };
    } catch {
      return {
        ok: false,
        adapter: this.adapter,
        message: "PostgreSQL storage is unavailable.",
      };
    }
  }
}
