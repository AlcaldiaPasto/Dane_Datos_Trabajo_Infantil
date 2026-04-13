import AppShell from "@/components/layout/app-shell";
import ComparisonKpis from "@/components/comparison/comparison-kpis";
import ComparisonChart from "@/components/comparison/comparison-chart";
import EmptyState from "@/components/ui/empty-state";
import { buildComparisonSnapshot } from "@/lib/analytics/comparison-service";
import { listDatasets } from "@/lib/datasets/dataset-service";

export const dynamic = "force-dynamic";

export default async function ComparisonPage() {
  const datasets = await listDatasets();
  const snapshot = buildComparisonSnapshot(datasets);

  return (
    <AppShell
      title="Comparacion anual"
      description="Pantalla preparada para comparar 2024 con cualquier otro ano limpio disponible en la sesion."
      sidebarContext={{
        eyebrow: "Analisis anual",
        title: "Comparacion anual",
        description: "Compara 2024 contra otro ano limpio cuando exista una segunda base disponible.",
        badge: snapshot.isReady ? "Disponible" : "Sin contraste",
      }}
    >
      {snapshot.isReady ? (
        <div className="flex min-h-full flex-col space-y-6">
          <ComparisonKpis items={snapshot.kpis} />
          <ComparisonChart title="Tendencia anual" message={snapshot.message} />
        </div>
      ) : (
        <EmptyState title="Comparacion no disponible" description={snapshot.message} />
      )}
    </AppShell>
  );
}
