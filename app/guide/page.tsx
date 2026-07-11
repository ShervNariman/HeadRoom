import Link from "next/link";

const steps = [
  {
    number: "01",
    title: "Connect read-only provider data",
    body: "Fetch usage, cost, quota, and reset information server-side. Keep credentials out of the browser.",
  },
  {
    number: "02",
    title: "Normalize every provider",
    body: "Convert incompatible units into timestamped snapshots while preserving each provider’s native metric.",
  },
  {
    number: "03",
    title: "Measure change over time",
    body: "Compare matching snapshots across 1h, 24h, and 7d windows to reveal spikes and sustained growth.",
  },
  {
    number: "04",
    title: "Calculate remaining headroom",
    body: "Estimate time to budget or quota exhaustion, then surface the next constraint and a clear action.",
  },
];

export default function GuidePage() {
  return (
    <main className="guide-shell">
      <header className="guide-topbar">
        <Link className="brand" href="/">
          <span className="brand-symbol">H</span>
          <span>Headroom</span>
        </Link>
        <Link className="secondary-button" href="/dashboard">Open dashboard</Link>
      </header>

      <section className="guide-hero">
        <div className="eyebrow">Copy the blueprint</div>
        <h1>Build a private usage dashboard for your own stack.</h1>
        <p>
          Headroom is intentionally simple: collect provider snapshots, compare matching windows,
          estimate runway, and keep the public demo completely separate from private account data.
        </p>
      </section>

      <section className="blueprint-grid">
        {steps.map((step) => (
          <article className="blueprint-card" key={step.number}>
            <div className="blueprint-number">{step.number}</div>
            <h2>{step.title}</h2>
            <p>{step.body}</p>
          </article>
        ))}
      </section>

      <section className="architecture-strip" aria-label="Headroom architecture">
        <div>
          <span>Provider adapters</span>
          <small>OpenAI · Vercel · Supabase · Resend</small>
        </div>
        <b>→</b>
        <div>
          <span>Normalized snapshots</span>
          <small>usage · spend · limit · timestamp</small>
        </div>
        <b>→</b>
        <div>
          <span>Headroom logic</span>
          <small>1h · 24h · 7d · runway · status</small>
        </div>
        <b>→</b>
        <div>
          <span>Private dashboard</span>
          <small>public code · private data</small>
        </div>
      </section>

      <section className="guide-footer-card">
        <div>
          <div className="eyebrow">Start safely</div>
          <h2>Run demo mode first. Add one provider second.</h2>
          <p>
            The public recording route uses deterministic mock data and never reads provider credentials.
          </p>
        </div>
        <div className="command-card">
          <code>pnpm install</code>
          <code>cp .env.example .env.local</code>
          <code>pnpm dev</code>
        </div>
      </section>
    </main>
  );
}
