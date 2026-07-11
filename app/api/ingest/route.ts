import { NextRequest, NextResponse } from "next/server";
import { requireIngestToken } from "@/lib/auth";
import { normalizeSnapshotInput } from "@/lib/integrations";
import { appendSnapshot } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const authorization = requireIngestToken(request);
  if (!authorization.ok) {
    return NextResponse.json({ error: authorization.message }, { status: authorization.status });
  }

  try {
    const snapshot = normalizeSnapshotInput(await request.json(), "webhook");
    await appendSnapshot(snapshot);
    return NextResponse.json({ ok: true, snapshot }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid webhook payload." },
      { status: 400 },
    );
  }
}
