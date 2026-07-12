import { NextRequest, NextResponse } from "next/server";
import { requirePrivateAction } from "@/lib/auth";
import { getLiveProviderMetrics } from "@/lib/live-metrics";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const authorization = requirePrivateAction(request);
  if (!authorization.ok) {
    return NextResponse.json(
      { mode: "demo", providers: [], error: authorization.message },
      { status: authorization.status },
    );
  }

  try {
    const providers = await getLiveProviderMetrics();
    return NextResponse.json({ mode: providers.length ? "live" : "demo", providers });
  } catch {
    return NextResponse.json(
      { mode: "demo", providers: [], error: "Unable to read Headroom data." },
      { status: 500 },
    );
  }
}
