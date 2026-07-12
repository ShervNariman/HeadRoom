import "server-only";

import { constants, promises as fs } from "node:fs";
import path from "node:path";
import type { HeadroomSnapshot } from "@/lib/integrations";
import { snapshotIdempotencyKey } from "@/lib/storage/idempotency";
import type { SnapshotStore, StorageHealth } from "@/lib/storage/snapshot-store";

const MAX_SNAPSHOTS = 5_000;
let writeQueue: Promise<unknown> = Promise.resolve();

function configuredStorePath() {
  return process.env.HEADROOM_DATA_FILE
    ? path.resolve(process.env.HEADROOM_DATA_FILE)
    : path.join(process.cwd(), ".headroom", "snapshots.json");
}

function materializeIdempotency(snapshot: HeadroomSnapshot): HeadroomSnapshot {
  return {
    ...snapshot,
    idempotencyKey: snapshotIdempotencyKey(snapshot),
  };
}

async function readFileSnapshots(filepath: string): Promise<HeadroomSnapshot[]> {
  try {
    const content = await fs.readFile(filepath, "utf8");
    const parsed = JSON.parse(content) as unknown;
    if (!Array.isArray(parsed)) {
      throw new Error("Snapshot store must contain a JSON array.");
    }
    return (parsed as HeadroomSnapshot[]).map(materializeIdempotency);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export class FileSnapshotStore implements SnapshotStore {
  readonly adapter = "file";

  private readonly filepath: string;

  constructor(filepath = configuredStorePath()) {
    this.filepath = filepath;
  }

  listSnapshots() {
    return readFileSnapshots(this.filepath);
  }

  appendSnapshot(snapshot: HeadroomSnapshot): Promise<HeadroomSnapshot> {
    const operation = writeQueue.then(async () => {
      const current = await readFileSnapshots(this.filepath);
      const materialized = materializeIdempotency(snapshot);
      const existing = current.find(
        (item) => item.idempotencyKey === materialized.idempotencyKey,
      );
      if (existing) return existing;

      const next = [...current, materialized].slice(-MAX_SNAPSHOTS);

      await fs.mkdir(path.dirname(this.filepath), { recursive: true });
      const temporary = `${this.filepath}.${process.pid}.${crypto.randomUUID()}.tmp`;
      await fs.writeFile(temporary, JSON.stringify(next, null, 2), {
        encoding: "utf8",
        mode: 0o600,
      });
      await fs.rename(temporary, this.filepath);
      return materialized;
    });

    writeQueue = operation.catch(() => undefined);
    return operation;
  }

  async healthcheck(): Promise<StorageHealth> {
    try {
      await fs.mkdir(path.dirname(this.filepath), { recursive: true });
      await fs.access(path.dirname(this.filepath), constants.R_OK | constants.W_OK);
      await readFileSnapshots(this.filepath);
      return { ok: true, adapter: this.adapter };
    } catch {
      return {
        ok: false,
        adapter: this.adapter,
        message: "Snapshot storage is unavailable.",
      };
    }
  }
}
