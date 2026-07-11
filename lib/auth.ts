import "server-only";

import type { NextRequest } from "next/server";

function bearer(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  return authorization.slice("Bearer ".length).trim();
}

export function requireIngestToken(request: NextRequest) {
  const expected = process.env.HEADROOM_INGEST_TOKEN;
  if (!expected) {
    return { ok: false as const, status: 503, message: "Set HEADROOM_INGEST_TOKEN before using the webhook." };
  }

  const supplied = bearer(request) ?? request.headers.get("x-headroom-token");
  if (supplied !== expected) {
    return { ok: false as const, status: 401, message: "Invalid ingestion token." };
  }

  return { ok: true as const };
}

export function requirePrivateAction(request: NextRequest) {
  const expected = process.env.HEADROOM_ACCESS_TOKEN;
  const supplied = request.headers.get("x-headroom-access-token") ?? bearer(request);

  if (expected) {
    return supplied === expected
      ? { ok: true as const }
      : { ok: false as const, status: 401, message: "Invalid Headroom access token." };
  }

  const host = request.headers.get("host") ?? "";
  const local = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  return local
    ? { ok: true as const }
    : {
        ok: false as const,
        status: 503,
        message: "Set HEADROOM_ACCESS_TOKEN before using private actions on a deployed instance.",
      };
}
