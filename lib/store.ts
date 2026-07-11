import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import type { HeadroomSnapshot } from "@/lib/integrations";

const MAX_SNAPSHOTS = 5000;

function storePath() {
  return process.env.HEADROOM_DATA_FILE
    ? path.resolve(process.env.HEADROOM_DATA_FILE)
    : path.join(process.cwd(), ".headroom", "snapshots.json");
}

export async function readSnapshots(): Promise<HeadroomSnapshot[]> {
  try {
    const content = await fs.readFile(storePath(), "utf8");
    const parsed = JSON.parse(content) as unknown;
    return Array.isArray(parsed) ? (parsed as HeadroomSnapshot[]) : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export async function appendSnapshot(snapshot: HeadroomSnapshot) {
  const filepath = storePath();
  const current = await readSnapshots();
  const next = [...current, snapshot].slice(-MAX_SNAPSHOTS);

  await fs.mkdir(path.dirname(filepath), { recursive: true });
  const temporary = `${filepath}.tmp`;
  await fs.writeFile(temporary, JSON.stringify(next, null, 2), "utf8");
  await fs.rename(temporary, filepath);

  return snapshot;
}
