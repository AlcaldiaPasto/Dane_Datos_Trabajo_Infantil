import AppShell from "@/components/layout/app-shell";
import DashboardClient from "@/components/dashboard/dashboard-client";
import { buildDashboardRecords } from "@/lib/analytics/dashboard-data-service";
import { getDefaultFilters } from "@/lib/analytics/dashboard-calculations";
import { listDatasets } from "@/lib/datasets/dataset-service";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const datasets = await listDatasets();
  const records = await buildDashboardRecords(datasets);
  const defaultFilters = getDefaultFilters(records);

  return (
    <AppShell
      title="Dashboard principal"
      description="Indicadores calculados desde los microdatos del DANE. Los filtros recalculan KPI, graficas y tabla en tiempo real."
      fixedViewport
      sidebarContext={{
        eyebrow: "Panel operativo",
        title: "Dashboard principal",
        description: "Indicadores DANE con filtros, KPI y graficas en tiempo real.",
        badge: `Año activo ${defaultFilters.year}`,
      }}
    >
      <DashboardClient records={records} />
    </AppShell>
  );
}
