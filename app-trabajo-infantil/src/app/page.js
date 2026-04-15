import AppShell from "@/components/layout/app-shell";
import DashboardIndexedDbPage from "@/components/dashboard/dashboard-indexeddb-page";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <AppShell
      title="Dashboard principal"
      description="Indicadores calculados desde microdatos locales en IndexedDB. Los filtros recalculan KPI, graficas y tabla en tiempo real."
      fixedViewport
      sidebarContext={{
        eyebrow: "Panel operativo",
        title: "Dashboard principal",
        description: "Indicadores DANE con filtros, KPI y graficas en tiempo real.",
        badge: "Datos locales",
      }}
    >
      <DashboardIndexedDbPage />
    </AppShell>
  );
}

