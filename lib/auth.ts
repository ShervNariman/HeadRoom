import "server-only";

import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

function bearer(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  return authorization.slice("Bearer ".length).trim();
}

function tokensMatch(supplied: string | null, expected: string) {
  if (!supplied) return false;
  const suppliedBuffer = Buffer.from(supplied);
  const expectedBuffer = Buffer.from(expected);
  return suppliedBuffer.length === expectedBuffer.length
    && timingSafeEqual(suppliedBuffer, expectedBuffer);
}

function isLocalDevelopment(request: NextRequest) {
  if (process.env.NODE_ENV === "production") return false;
  const hostname = request.nextUrl.hostname.toLowerCase();
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export function requireIngestToken(request: NextRequest) {
  const expected = process.env.HEADROOM_INGEST_TOKEN;
  if (!expected) {
    return { ok: false as const, status: 503, message: "Webhook ingestion is not configured." };
  }

  const supplied = bearer(request) ?? request.headers.get("x-headroom-token");
  if (!tokensMatch(supplied, expected)) {
    return { ok: false as const, status: 401, message: "Invalid ingestion token." };
  }

  return { ok: true as const };
}

export function requirePrivateAction(request: NextRequest) {
  const expected = process.env.HEADROOM_ACCESS_TOKEN;
  const supplied = request.headers.get("x-headroom-access-token") ?? bearer(request);

  if (expected) {
    return tokensMatch(supplied, expected)
      ? { ok: true as const }
      : { ok: false as const, status: 401, message: "Private access is required." };
  }

  return isLocalDevelopment(request)
    ? { ok: true as const }
    : {
        ok: false as const,
        status: 503,
        message: "Private access is not configured for this deployment.",
      };
}
