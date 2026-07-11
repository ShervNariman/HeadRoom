import { HeadroomDashboard } from "@/components/headroom-dashboard";
import type { DemoScenario } from "@/lib/mock-data";

const validScenarios = new Set<DemoScenario>(["normal", "spike", "critical"]);

// Recording-only route: deterministic demo data, no private provider credentials.
export default async function HeadroomRecordingPage({
  searchParams,
}: {
  searchParams: Promise<{ scenario?: string }>;
}) {
  const params = await searchParams;
  const requested = params.scenario as DemoScenario | undefined;
  const initialScenario = requested && validScenarios.has(requested) ? requested : "normal";

  return <HeadroomDashboard recording initialScenario={initialScenario} />;
}
