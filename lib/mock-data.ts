export type ProviderStatus =
  | "Healthy"
  | "Elevated"
  | "Warning"
  | "Critical"
  | "Stale"
  | "Disconnected";

export type ProviderMetric = {
  provider: string;
  abbreviation: string;
  usage: string;
  spend: number;
  spendRemaining: string;
  limit: string;
  stackShare: number;
  change1h: number;
  change24h: number;
  change7d: number;
  runway: string;
  status: ProviderStatus;
  note: string;
  updated: string;
};

export type DemoScenario = "normal" | "spike" | "critical";

const normal: ProviderMetric[] = [
  {
    provider: "OpenAI",
    abbreviation: "OA",
    usage: "8.2M tokens",
    spend: 42,
    spendRemaining: "$58",
    limit: "$100 budget",
    stackShare: 46,
    change1h: 12,
    change24h: 31,
    change7d: 8,
    runway: "14 days",
    status: "Elevated",
    note: "Largest share of tracked spend",
    updated: "2 min ago",
  },
  {
    provider: "Supabase",
    abbreviation: "SB",
    usage: "73 GB egress",
    spend: 22,
    spendRemaining: "27 GB",
    limit: "100 GB",
    stackShare: 24,
    change1h: 2,
    change24h: 6,
    change7d: -3,
    runway: "18 days",
    status: "Healthy",
    note: "Egress is below the current trend",
    updated: "6 min ago",
  },
  {
    provider: "Vercel",
    abbreviation: "VE",
    usage: "810 GB bandwidth",
    spend: 16,
    spendRemaining: "190 GB",
    limit: "1 TB",
    stackShare: 18,
    change1h: 8,
    change24h: 24,
    change7d: 17,
    runway: "7 days",
    status: "Warning",
    note: "Bandwidth accelerated after the latest deploy",
    updated: "4 min ago",
  },
  {
    provider: "Resend",
    abbreviation: "RE",
    usage: "2,420 emails",
    spend: 11,
    spendRemaining: "580 emails",
    limit: "3,000 / month",
    stackShare: 12,
    change1h: 4,
    change24h: 18,
    change7d: 11,
    runway: "9 days",
    status: "Healthy",
    note: "Transactional volume is stable",
    updated: "1 min ago",
  },
];

const spike: ProviderMetric[] = normal.map((item) =>
  item.provider === "Resend"
    ? {
        ...item,
        usage: "2,760 emails",
        spendRemaining: "240 emails",
        change1h: 87,
        change24h: 48,
        change7d: 22,
        runway: "19 hours",
        status: "Critical" as const,
        note: "Onboarding traffic is consuming the monthly allowance",
      }
    : item,
);

const critical: ProviderMetric[] = spike.map((item) =>
  item.provider === "Vercel"
    ? {
        ...item,
        usage: "963 GB bandwidth",
        spendRemaining: "37 GB",
        change1h: 64,
        change24h: 92,
        change7d: 51,
        runway: "8 hours",
        status: "Critical" as const,
        note: "Launch traffic may exhaust bandwidth before tomorrow",
      }
    : item,
);

export const demoScenarios: Record<DemoScenario, ProviderMetric[]> = {
  normal,
  spike,
  critical,
};
