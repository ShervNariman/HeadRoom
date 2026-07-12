import "server-only";

import type { HeadroomSnapshot } from "@/lib/integrations";
import { getSnapshotStore } from "@/lib/storage";

export function readSnapshots(): Promise<HeadroomSnapshot[]> {
  return getSnapshotStore().listSnapshots();
}

export function appendSnapshot(snapshot: HeadroomSnapshot): Promise<HeadroomSnapshot> {
  return getSnapshotStore().appendSnapshot(snapshot);
}
