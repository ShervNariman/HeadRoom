"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type SetupStatus = {
  openai: boolean;
  webhook: boolean;
  privateActions: boolean;
  localStorage: boolean;
};

type Notice = { tone: "success" | "error" | "neutral"; message: string } | null;

const emptyStatus: SetupStatus = {
  openai: false,
  webhook: false,
  privateActions: false,
  localStorage: true,
};

export function SetupClient() {
  const [status, setStatus] = useState<SetupStatus>(emptyStatus);
  const [accessToken, setAccessToken] = useState("");
  const [notice, setNotice] = useState<Notice>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const origin = "http://localhost:3000";

  useEffect(() => {
    fetch("/api/setup/status", { cache: "no-store" })
      .then((response) => response.json())
      .then((value: SetupStatus) => setStatus(value))
      .catch(() => setNotice({ tone: "error", message: "Could not read setup status." }));
  }, []);

  const webhookExample = `curl -X POST ${origin}/api/ingest \\
  -H "Authorization: Bearer YOUR_INGEST_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "provider": "Replicate",
    "metric": "Predictions",
    "usage": 840,
    "unit": "predictions",
    "limit": 1000,
    "spend": 31.40,
    "budget": 50
  }'`;

  async function syncOpenAI() {
    setBusy("openai");
    setNotice(null);
    try {
      const response = await fetch("/api/providers/openai/sync", {
        method: "POST",
        headers: accessToken ? { "x-headroom-access-token": accessToken } : undefined,
      });
      const value = await response.json();
      if (!response.ok) throw new Error(value.error || "OpenAI sync failed.");
      setNotice({ tone: "success", message: "OpenAI usage was added to Headroom." });
    } catch (error) {
      setNotice({ tone: "error", message: error instanceof Error ? error.message : "OpenAI sync failed." });
    } finally {
      setBusy(null);
    }
  }

  async function addManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("manual");
    setNotice(null);
    const form = new FormData(event.currentTarget);
    const payload = {
      provider: form.get("provider"),
      metric: form.get("metric"),
      usage: form.get("usage"),
      unit: form.get("unit"),
      limit: form.get("limit"),
      spend: form.get("spend"),
      budget: form.get("budget"),
    };

    try {
      const response = await fetch("/api/manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { "x-headroom-access-token": accessToken } : {}),
        },
        body: JSON.stringify(payload),
      });
      const value = await response.json();
      if (!response.ok) throw new Error(value.error || "Could not add provider.");
      event.currentTarget.reset();
      setNotice({ tone: "success", message: `${value.snapshot.provider} was added. Open the dashboard to see it.` });
    } catch (error) {
      setNotice({ tone: "error", message: error instanceof Error ? error.message : "Could not add provider." });
    } finally {
      setBusy(null);
    }
  }

  function copyWebhook() {
    navigator.clipboard.writeText(webhookExample)
      .then(() => setNotice({ tone: "success", message: "Webhook example copied." }))
      .catch(() => setNotice({ tone: "error", message: "Could not copy the webhook example." }));
  }

  return (
    <main className="setup-shell">
      <header className="setup-topbar">
        <Link className="brand" href="/dashboard">
          <span className="brand-symbol">H</span>
          <span>Headroom</span>
        </Link>
        <div className="setup-nav">
          <Link className="text-link" href="/guide">How it works</Link>
          <Link className="secondary-button" href="/dashboard">Open dashboard</Link>
        </div>
      </header>

      <section className="setup-hero">
        <div className="eyebrow">Simple setup</div>
        <h1>Choose the easiest way to add your first provider.</h1>
        <p>Start with one connection. Headroom keeps the setup local, private, and easy to undo.</p>
        <div className="setup-progress" aria-label="Setup steps">
          <span className="setup-step-active">1 · Choose a path</span>
          <span>2 · Add one provider</span>
          <span>3 · Open your dashboard</span>
        </div>
      </section>

      <section className="setup-content">
        {status.privateActions && (
          <label className="access-field">
            <span>Private access token</span>
            <input
              type="password"
              value={accessToken}
              onChange={(event) => setAccessToken(event.target.value)}
              placeholder="Required for private actions on deployed instances"
            />
          </label>
        )}

        {notice && <div className={`setup-notice setup-notice-${notice.tone}`}>{notice.message}</div>}

        <div className="setup-grid">
          <article className="setup-card setup-card-featured">
            <div className="setup-card-topline">
              <span className="setup-number">01</span>
              <span className={status.openai ? "setup-state setup-state-ready" : "setup-state"}>
                {status.openai ? "Key detected" : "2-minute setup"}
              </span>
            </div>
            <h2>Connect OpenAI</h2>
            <p>Use an organization admin key to pull monthly token usage and cost.</p>
            <ol className="setup-list">
              <li>Add <code>OPENAI_ADMIN_KEY</code> to <code>.env.local</code>.</li>
              <li>Optionally add <code>OPENAI_MONTHLY_BUDGET</code>.</li>
              <li>Restart Headroom and sync.</li>
            </ol>
            <button className="primary-button setup-button" type="button" onClick={syncOpenAI} disabled={busy !== null}>
              {busy === "openai" ? "Syncing…" : status.openai ? "Sync OpenAI now" : "Check OpenAI setup"}
            </button>
            <div className="setup-footnote">Your key stays server-side and is never shown in the browser.</div>
          </article>

          <article className="setup-card">
            <div className="setup-card-topline">
              <span className="setup-number">02</span>
              <span className={status.webhook ? "setup-state setup-state-ready" : "setup-state"}>
                {status.webhook ? "Webhook ready" : "Works with any service"}
              </span>
            </div>
            <h2>Send a webhook</h2>
            <p>Post one small JSON payload from any metered service, cron job, or automation.</p>
            <pre className="webhook-preview"><code>{webhookExample}</code></pre>
            <button className="secondary-button setup-button" type="button" onClick={copyWebhook}>
              Copy webhook example
            </button>
            <div className="setup-footnote">Set <code>HEADROOM_INGEST_TOKEN</code> before accepting events.</div>
          </article>

          <article className="setup-card">
            <div className="setup-card-topline">
              <span className="setup-number">03</span>
              <span className="setup-state">No API required</span>
            </div>
            <h2>Add a provider manually</h2>
            <p>Perfect for services that do not expose usage APIs yet.</p>
            <form className="manual-form" onSubmit={addManual}>
              <label><span>Provider</span><input name="provider" placeholder="Resend" required /></label>
              <label><span>Metric</span><input name="metric" placeholder="Monthly emails" required /></label>
              <div className="form-row">
                <label><span>Usage</span><input name="usage" type="number" min="0" step="any" placeholder="2760" required /></label>
                <label><span>Unit</span><input name="unit" placeholder="emails" required /></label>
              </div>
              <div className="form-row">
                <label><span>Limit</span><input name="limit" type="number" min="0" step="any" placeholder="3000" /></label>
                <label><span>Spend</span><input name="spend" type="number" min="0" step="any" placeholder="20" /></label>
              </div>
              <label><span>Budget</span><input name="budget" type="number" min="0" step="any" placeholder="50" /></label>
              <button className="primary-button setup-button" type="submit" disabled={busy !== null}>
                {busy === "manual" ? "Adding…" : "Add to Headroom"}
              </button>
            </form>
          </article>
        </div>

        <div className="setup-finish">
          <div>
            <span className="setup-finish-label">Ready when one provider appears</span>
            <h2>You do not need to connect everything at once.</h2>
            <p>Start with the service most likely to surprise you, then add the rest only when useful.</p>
          </div>
          <Link className="primary-button" href="/dashboard">View my dashboard →</Link>
        </div>
      </section>
    </main>
  );
}
