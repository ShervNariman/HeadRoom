import "server-only";

import { getRuntimeConfig } from "@/lib/runtime-config";
import { FileSnapshotStore } from "@/lib/storage/file-snapshot-store";
import { PostgresSnapshotStore } from "@/lib/storage/postgres-snapshot-store";
import type { SnapshotStore } from "@/lib/storage/snapshot-store";

let singleton: SnapshotStore | undefined;

export function getSnapshotStore(): SnapshotStore {
  if (!singleton) {
    const config = getRuntimeConfig();
    singleton = config.storageAdapter === "postgres"
      ? new PostgresSnapshotStore()
      : new FileSnapshotStore();
  }
  return singleton;
}

export function resetSnapshotStoreForTests() {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("Snapshot store reset is test-only.");
  }
  singleton = undefined;
}

export type { SnapshotStore, StorageHealth } from "@/lib/storage/snapshot-store";
