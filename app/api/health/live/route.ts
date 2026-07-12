import { NextResponse } from "next/server";
import { getRuntimeConfig } from "@/lib/runtime-config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const config = getRuntimeConfig();
  return NextResponse.json(
    {
      status: "ok",
      service: "headroom",
      version: config.version,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
