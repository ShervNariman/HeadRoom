import { NextResponse } from "next/server";
import { getLiveProviderMetrics } from "@/lib/live-metrics";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const providers = await getLiveProviderMetrics();
    return NextResponse.json({ mode: providers.length ? "live" : "demo", providers });
  } catch (error) {
    return NextResponse.json(
      { mode: "demo", providers: [], error: error instanceof Error ? error.message : "Unable to read Headroom data." },
      { status: 500 },
    );
  }
}
