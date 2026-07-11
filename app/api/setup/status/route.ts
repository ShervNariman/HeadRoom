import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    openai: Boolean(process.env.OPENAI_ADMIN_KEY),
    webhook: Boolean(process.env.HEADROOM_INGEST_TOKEN),
    privateActions: Boolean(process.env.HEADROOM_ACCESS_TOKEN),
    localStorage: !process.env.HEADROOM_DATA_FILE,
  });
}
