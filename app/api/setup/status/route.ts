import { NextRequest, NextResponse } from "next/server";
import { requirePrivateAction } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const authorization = requirePrivateAction(request);
  if (!authorization.ok) {
    return NextResponse.json(
      {
        openai: false,
        webhook: false,
        privateActions: true,
        localStorage: false,
        locked: true,
      },
      { status: authorization.status },
    );
  }

  return NextResponse.json({
    openai: Boolean(process.env.OPENAI_ADMIN_KEY),
    webhook: Boolean(process.env.HEADROOM_INGEST_TOKEN),
    privateActions: Boolean(process.env.HEADROOM_ACCESS_TOKEN),
    localStorage: !process.env.HEADROOM_DATA_FILE,
    locked: false,
  });
}
