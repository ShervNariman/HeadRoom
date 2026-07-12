import "server-only";

import { FileSnapshotStore } from "@/lib/storage/file-snapshot-store";
import type { SnapshotStore } from "@/lib/storage/snapshot-store";

let singleton: SnapshotStore | undefined;

export function getSnapshotStore(): SnapshotStore {
  if (!singleton) {
    singleton = new FileSnapshotStore();
  }
  return singleton;
}

export type { SnapshotStore, StorageHealth } from "@/lib/storage/snapshot-store";
