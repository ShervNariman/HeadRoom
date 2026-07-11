import "server-only";

import type { ProviderMetric, ProviderStatus } from "@/lib/mock-data";
import type { HeadroomSnapshot } from "@/lib/integrations";
import { readSnapshots } from "@/lib/store";

function compact(value: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function money(value: number, currency = "USD") {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function nearestBefore(history: HeadroomSnapshot[], cutoff: number) {
  return [...history]
    .filter((item) => new Date(item.capturedAt).getTime() <= cutoff)
    .sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime())[0];
}

function percentChange(current: number, previous?: number) {
  if (previous === undefined || previous <= 0) return 0;
  return Math.round(((current - previous) / previous) * 100);
}

function runway(
  history: HeadroomSnapshot[],
  latest: HeadroomSnapshot,
  current: number,
  cap?: number,
  valueOf: (snapshot: HeadroomSnapshot) => number | undefined = (snapshot) => snapshot.usage,
) {
  if (!cap) return "—";
  if (current >= cap) return "Now";

  const candidates = [...history]
    .filter((snapshot) => valueOf(snapshot) !== undefined)
    .sort((a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime());
  const oldest = candidates[0];
  const oldestValue = oldest ? valueOf(oldest) : undefined;
  if (!oldest || oldest.id === latest.id || oldestValue === undefined || current <= oldestValue) return "—";

  const elapsedHours = Math.max(
    0.01,
    (new Date(latest.capturedAt).getTime() - new Date(oldest.capturedAt).getTime()) / 3_600_000,
  );
  const hourlyRate = (current - oldestValue) / elapsedHours;
  if (hourlyRate <= 0) return "—";
  const hours = (cap - current) / hourlyRate;
  if (hours < 24) return `${Math.max(1, Math.round(hours))} hours`;
  return `${Math.max(1, Math.round(hours / 24))} days`;
}

function status(current: number, cap: number | undefined, runwayValue: string): ProviderStatus {
  if (!cap) return "Healthy";
  const consumed = current / cap;
  const hours = runwayValue.endsWith("hours") ? Number.parseInt(runwayValue, 10) : null;
  if (consumed >= 0.95 || (hours !== null && hours <= 24)) return "Critical";
  if (consumed >= 0.8) return "Warning";
  if (consumed >= 0.6) return "Elevated";
  return "Healthy";
}

function abbreviation(provider: string) {
  return provider
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export async function getLiveProviderMetrics(): Promise<ProviderMetric[]> {
  const snapshots = await readSnapshots();
  const groups = new Map<string, HeadroomSnapshot[]>();

  for (const snapshot of snapshots) {
    const key = `${snapshot.provider}::${snapshot.metric}`;
    groups.set(key, [...(groups.get(key) ?? []), snapshot]);
  }

  const now = Date.now();
  const latestGroups = [...groups.values()].map((history) => {
    const sorted = [...history].sort(
      (a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime(),
    );
    return { history: sorted, latest: sorted.at(-1)! };
  });
  const totalSpend = latestGroups.reduce((sum, group) => sum + (group.latest.spend ?? 0), 0);

  return latestGroups.map(({ history, latest }) => {
    const oneHour = nearestBefore(history, now - 3_600_000);
    const oneDay = nearestBefore(history, now - 86_400_000);
    const oneWeek = nearestBefore(history, now - 604_800_000);
    const budgetMode = latest.budget !== undefined && latest.spend !== undefined;
    const currentForLimit = budgetMode ? latest.spend! : latest.usage;
    const configuredLimit = budgetMode ? latest.budget : latest.limit;
    const runwayValue = runway(
      history,
      latest,
      currentForLimit,
      configuredLimit,
      budgetMode ? (snapshot) => snapshot.spend : (snapshot) => snapshot.usage,
    );
    const providerStatus = status(currentForLimit, configuredLimit, runwayValue);
    const remaining = latest.limit === undefined ? undefined : Math.max(0, latest.limit - latest.usage);
    const remainingBudget = latest.budget === undefined || latest.spend === undefined
      ? undefined
      : Math.max(0, latest.budget - latest.spend);
    const captured = new Date(latest.capturedAt).getTime();
    const minutesAgo = Math.max(0, Math.round((now - captured) / 60_000));

    return {
      provider: latest.provider,
      abbreviation: abbreviation(latest.provider),
      usage: `${compact(latest.usage)} ${latest.unit}`,
      spend: latest.spend ?? 0,
      spendRemaining: remainingBudget !== undefined
        ? money(remainingBudget, latest.currency ?? "USD")
        : remaining !== undefined
          ? `${compact(remaining)} ${latest.unit}`
          : "Not set",
      limit: latest.budget !== undefined
        ? `${money(latest.budget, latest.currency ?? "USD")} budget`
        : latest.limit !== undefined
          ? `${compact(latest.limit)} ${latest.unit}`
          : "Not set",
      stackShare: totalSpend > 0 && latest.spend
        ? Math.round((latest.spend / totalSpend) * 100)
        : 0,
      change1h: percentChange(latest.usage, oneHour?.usage),
      change24h: percentChange(latest.usage, oneDay?.usage),
      change7d: percentChange(latest.usage, oneWeek?.usage),
      runway: runwayValue,
      status: providerStatus,
      note: providerStatus === "Critical"
        ? `${latest.metric} is close to its configured limit`
        : `${latest.metric} received through ${latest.source}`,
      updated: minutesAgo <= 1 ? "just now" : `${minutesAgo} min ago`,
    };
  });
}
