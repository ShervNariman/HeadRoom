import "server-only";

import type { HeadroomSnapshot } from "@/lib/integrations";

export type StorageHealth =
  | {
      ok: true;
      adapter: string;
    }
  | {
      ok: false;
      adapter: string;
      message: string;
    };

export interface SnapshotStore {
  readonly adapter: string;
  listSnapshots(): Promise<HeadroomSnapshot[]>;
  appendSnapshot(snapshot: HeadroomSnapshot): Promise<HeadroomSnapshot>;
  healthcheck(): Promise<StorageHealth>;
}
