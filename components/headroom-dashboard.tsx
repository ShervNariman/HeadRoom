"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  demoScenarios,
  type DemoScenario,
  type ProviderMetric,
  type ProviderStatus,
} from "@/lib/mock-data";

type HeadroomDashboardProps = {
  recording?: boolean;
  initialScenario?: DemoScenario;
};

const statusClass: Record<ProviderStatus, string> = {
  Healthy: "status status-healthy",
  Elevated: "status status-elevated",
  Warning: "status status-warning",
  Critical: "status status-critical",
  Stale: "status status-stale",
  Disconnected: "status status-disconnected",
};

const statusRank: Record<ProviderStatus, number> = {
  Critical: 0,
  Warning: 1,
  Elevated: 2,
  Healthy: 3,
  Stale: 4,
  Disconnected: 5,
};

const scenarioLabels: Record<DemoScenario, string> = {
  normal: "Normal",
  spike: "24h spike",
  critical: "Near limit",
};

function formatChange(value: number) {
  if (value === 0) return "0%";
  return `${value > 0 ? "+" : ""}${value}%`;
}

function ChangeValue({ value }: { value: number }) {
  const tone = value >= 40 ? "change-hot" : value > 0 ? "change-up" : "change-down";
  return <span className={tone}>{formatChange(value)}</span>;
}

function KpiCard({
  label,
  value,
  detail,
  emphasis = false,
}: {
  label: string;
  value: string;
  detail: string;
  emphasis?: boolean;
}) {
  return (
    <article className={`kpi-card ${emphasis ? "kpi-emphasis" : ""}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <p className="kpi-detail">{detail}</p>
    </article>
  );
}

function ProviderRow({ provider }: { provider: ProviderMetric }) {
  return (
    <tr className={provider.status === "Critical" ? "critical-row" : undefined}>
      <td>
        <div className="provider-cell">
          <div className="provider-mark" aria-hidden="true">
            {provider.abbreviation}
          </div>
          <div>
            <div className="provider-name">{provider.provider}</div>
            <div className="provider-note">{provider.note}</div>
          </div>
        </div>
      </td>
      <td className="metric-strong">{provider.usage}</td>
      <td>{provider.spendRemaining}</td>
      <td>{provider.limit}</td>
      <td>
        <div className="share-cell">
          <span>{provider.stackShare}%</span>
          <div className="share-track" aria-hidden="true">
            <div className="share-fill" style={{ width: `${provider.stackShare}%` }} />
          </div>
        </div>
      </td>
      <td><ChangeValue value={provider.change1h} /></td>
      <td><ChangeValue value={provider.change24h} /></td>
      <td><ChangeValue value={provider.change7d} /></td>
      <td className="runway-cell">{provider.runway}</td>
      <td>
        <span className={statusClass[provider.status]}>{provider.status}</span>
        <div className="updated">Updated {provider.updated}</div>
      </td>
    </tr>
  );
}

function SignalBanner({ provider }: { provider: ProviderMetric }) {
  const isCritical = provider.status === "Critical";
  const title = isCritical
    ? `${provider.provider} may become a constraint in ${provider.runway}.`
    : `${provider.provider} is the next likely constraint.`;

  const action = !isCritical
    ? "Watch the current trend before the next launch."
    : provider.provider === "Resend"
      ? "Review onboarding email volume or increase the monthly allowance."
      : provider.provider === "OpenAI"
        ? "Review high-cost workloads or raise the monthly budget."
        : "Review the configured limit or reduce nonessential usage.";

  return (
    <section className={`signal-banner ${isCritical ? "signal-critical" : ""}`}>
      <div className="signal-icon" aria-hidden="true">↗</div>
      <div className="signal-copy">
        <div className="signal-kicker">Headroom signal</div>
        <h2>{title}</h2>
        <p>
          {provider.note}. Usage changed {formatChange(provider.change1h)} in 1h and {formatChange(provider.change24h)} in 24h.
        </p>
      </div>
      <div className="signal-action">
        <span>Recommended action</span>
        <strong>{action}</strong>
      </div>
    </section>
  );
}

export function HeadroomDashboard({
  recording = false,
  initialScenario = "normal",
}: HeadroomDashboardProps) {
  const [scenario, setScenario] = useState<DemoScenario>(initialScenario);
  const [liveProviders, setLiveProviders] = useState<ProviderMetric[] | null>(null);
  const [dataMode, setDataMode] = useState<"demo" | "live">("demo");

  useEffect(() => {
    if (recording) return;

    fetch("/api/dashboard", { cache: "no-store" })
      .then((response) => response.json())
      .then((value: { mode?: "demo" | "live"; providers?: ProviderMetric[] }) => {
        if (value.mode === "live" && value.providers?.length) {
          setLiveProviders(value.providers);
          setDataMode("live");
        }
      })
      .catch(() => {
        setLiveProviders(null);
        setDataMode("demo");
      });
  }, [recording]);

  const providers = liveProviders?.length ? liveProviders : demoScenarios[scenario];

  const summary = useMemo(() => {
    const totalSpend = providers.reduce((sum, provider) => sum + provider.spend, 0);
    const topDriver = [...providers].sort((a, b) => b.stackShare - a.stackShare)[0];
    const fastest = [...providers].sort((a, b) => b.change24h - a.change24h)[0];
    const sortedByRisk = [...providers].sort(
      (a, b) => statusRank[a.status] - statusRank[b.status],
    );
    const nextConstraint = sortedByRisk[0];

    return { totalSpend, topDriver, fastest, nextConstraint, sortedByRisk };
  }, [providers]);

  return (
    <div className={recording ? "app-shell recording-shell" : "app-shell"}>
      {!recording && (
        <header className="topbar">
          <Link className="brand" href="/dashboard" aria-label="Headroom dashboard">
            <span className="brand-symbol">H</span>
            <span>Headroom</span>
          </Link>
          <div className="topbar-actions">
            <Link className="text-link" href="/setup">Connect providers</Link>
            <Link className="text-link" href="/guide">Build your own</Link>
            <span className="privacy-pill">Private MVP</span>
            <button className="avatar" type="button" aria-label="Account menu">SN</button>
          </div>
        </header>
      )}

      <main className="dashboard-wrap">
        <section className="dashboard-heading">
          <div>
            <div className="eyebrow">API runway monitor</div>
            <h1>Know what your product will run out of next.</h1>
            <p>
              Usage, remaining spend, limits, and velocity across the services powering your product.
            </p>
          </div>
          {dataMode === "demo" && <div className="scenario-control" aria-label="Demo scenario">
            {(Object.keys(scenarioLabels) as DemoScenario[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setScenario(key)}
                className={scenario === key ? "scenario-active" : ""}
              >
                {scenarioLabels[key]}
              </button>
            ))}
          </div>}
        </section>

        <SignalBanner provider={summary.nextConstraint} />

        <section className="kpi-grid" aria-label="Key performance indicators">
          <KpiCard
            label="Tracked spend"
            value={`$${summary.totalSpend}`}
            detail={dataMode === "live" ? `Across ${providers.length} connected metrics` : "Across four demo providers this month"}
          />
          <KpiCard
            label="Top cost driver"
            value={`${summary.topDriver.provider} · ${summary.topDriver.stackShare}%`}
            detail="Largest share of total tracked spend"
          />
          <KpiCard
            label="Next constraint"
            value={`${summary.nextConstraint.provider} · ${summary.nextConstraint.runway}`}
            detail={summary.nextConstraint.note}
            emphasis
          />
          <KpiCard
            label="Fastest growing"
            value={`${summary.fastest.provider} · ${formatChange(summary.fastest.change24h)}`}
            detail="Change over the last 24 hours"
          />
        </section>

        <section className="table-card">
          <div className="table-header">
            <div>
              <h2>Provider headroom</h2>
              <p>{dataMode === "live" ? "Local snapshots · rolling comparisons · stack share is based on tracked spend" : "Demo data · rolling comparisons · stack share is based on tracked spend"}</p>
            </div>
            <div className="live-indicator"><span /> {dataMode === "live" ? "Live local data" : "Demo mode"}</div>
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>Usage</th>
                  <th>Spend remaining</th>
                  <th>Limit</th>
                  <th>Stack share</th>
                  <th>1h</th>
                  <th>24h</th>
                  <th>7d</th>
                  <th>Runway</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {summary.sortedByRisk.map((provider) => (
                  <ProviderRow key={`${provider.provider}-${provider.usage}`} provider={provider} />
                ))}
              </tbody>
            </table>
          </div>

          <footer className="table-footer">
            <span>Last refresh: just now</span>
            <span>{dataMode === "live" ? "Provider credentials remain server-side." : "All values shown here are deterministic demo data."}</span>
          </footer>
        </section>
      </main>
    </div>
  );
}
