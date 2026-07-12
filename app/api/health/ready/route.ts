import { NextResponse } from "next/server";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { getSnapshotStore } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const config = getRuntimeConfig();
    const storage = await getSnapshotStore().healthcheck();
    const privateAccessReady = config.environment !== "production" || config.privateAccessConfigured;
    const ready = storage.ok && privateAccessReady;

    return NextResponse.json(
      {
        status: ready ? "ready" : "not_ready",
        checks: {
          storage: storage.ok ? "ok" : "unavailable",
          privateAccess: privateAccessReady ? "ok" : "not_configured",
        },
      },
      {
        status: ready ? 200 : 503,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch {
    return NextResponse.json(
      {
        status: "not_ready",
        checks: {
          configuration: "invalid",
        },
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
