import { NextRequest, NextResponse } from "next/server";
import { requirePrivateAction } from "@/lib/auth";
import type { HeadroomSnapshot } from "@/lib/integrations";
import { appendSnapshot } from "@/lib/store";

export const runtime = "nodejs";

const OPENAI_API = "https://api.openai.com/v1";

class OpenAIRequestError extends Error {
  constructor(public readonly status: number) {
    super(`OpenAI request failed with status ${status}.`);
  }
}

type UsagePage = {
  data?: Array<{
    results?: Array<{
      input_tokens?: number;
      output_tokens?: number;
      input_audio_tokens?: number;
      output_audio_tokens?: number;
    }>;
  }>;
};

type CostsPage = {
  data?: Array<{
    results?: Array<{
      amount?: { value?: number; currency?: string };
    }>;
  }>;
};

async function openAIGet<T>(path: string, key: string) {
  const response = await fetch(`${OPENAI_API}${path}`, {
    headers: { Authorization: `Bearer ${key}` },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new OpenAIRequestError(response.status);
  }

  return response.json() as Promise<T>;
}

export async function POST(request: NextRequest) {
  const authorization = requirePrivateAction(request);
  if (!authorization.ok) {
    return NextResponse.json({ error: authorization.message }, { status: authorization.status });
  }

  const key = process.env.OPENAI_ADMIN_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "OpenAI sync is not configured." },
      { status: 503 },
    );
  }

  try {
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const query = new URLSearchParams({
      start_time: String(Math.floor(start.getTime() / 1000)),
      end_time: String(Math.floor(now.getTime() / 1000)),
      bucket_width: "1d",
      limit: "31",
    });

    const [usage, costs] = await Promise.all([
      openAIGet<UsagePage>(`/organization/usage/completions?${query}`, key),
      openAIGet<CostsPage>(`/organization/costs?${query}`, key),
    ]);

    const tokens = (usage.data ?? []).reduce(
      (bucketTotal, bucket) => bucketTotal + (bucket.results ?? []).reduce(
        (resultTotal, result) => resultTotal
          + (result.input_tokens ?? 0)
          + (result.output_tokens ?? 0)
          + (result.input_audio_tokens ?? 0)
          + (result.output_audio_tokens ?? 0),
        0,
      ),
      0,
    );

    let currency = "USD";
    const spend = (costs.data ?? []).reduce(
      (bucketTotal, bucket) => bucketTotal + (bucket.results ?? []).reduce((resultTotal, result) => {
        if (result.amount?.currency) currency = result.amount.currency.toUpperCase();
        return resultTotal + (result.amount?.value ?? 0);
      }, 0),
      0,
    );

    const budget = process.env.OPENAI_MONTHLY_BUDGET
      ? Number(process.env.OPENAI_MONTHLY_BUDGET)
      : undefined;

    const snapshot: HeadroomSnapshot = {
      id: crypto.randomUUID(),
      provider: "OpenAI",
      metric: "Monthly token usage",
      usage: tokens,
      unit: "tokens",
      spend,
      budget: Number.isFinite(budget) ? budget : undefined,
      currency,
      project: process.env.OPENAI_PROJECT_LABEL || undefined,
      source: "openai",
      capturedAt: now.toISOString(),
    };

    await appendSnapshot(snapshot);
    return NextResponse.json({ ok: true, snapshot });
  } catch (error) {
    const status = error instanceof OpenAIRequestError ? error.status : 502;
    return NextResponse.json(
      {
        error: status === 401 || status === 403
          ? "OpenAI rejected the configured credential or organization scope."
          : "OpenAI sync failed without exposing upstream response details.",
      },
      { status: 502 },
    );
  }
}
