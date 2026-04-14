import AppShell from "@/components/layout/app-shell";
import ComparisonKpis from "@/components/comparison/comparison-kpis";
import ComparisonChart from "@/components/comparison/comparison-chart";
import ComparisonChartGuide from "@/components/comparison/comparison-chart-guide";
import ComparisonAgeLineChart from "@/components/comparison/comparison-age-line-chart";
import ComparisonIndicatorTrendCharts from "@/components/comparison/comparison-indicator-trend-charts";
import EmptyState from "@/components/ui/empty-state";
import Card from "@/components/ui/card";
import { buildComparisonSnapshot } from "@/lib/analytics/comparison-service";
import { buildDashboardRecords } from "@/lib/analytics/dashboard-data-service";
import { listDatasets } from "@/lib/datasets/dataset-service";

export const dynamic = "force-dynamic";

function ComparisonControls({ years, baseYear, targetYear, allYearsValue }) {
  return (
    <Card title="Seleccionar comparacion" subtitle="Compara trabajo infantil entre dos años o en todos los años disponibles.">
      <form className="grid min-w-0 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] xl:items-end">
        <label className="block">
          <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted">Año base</span>
          <select
            name="baseYear"
            defaultValue={baseYear}
            className="mt-2 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm font-semibold text-foreground outline-none transition focus:border-accent focus:ring-4 focus:ring-teal-100"
          >
            {years.map((year) => (
              <option key={`base-${year}`} value={year}>{year}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted">Año comparado</span>
          <select
            name="targetYear"
            defaultValue={targetYear}
            className="mt-2 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm font-semibold text-foreground outline-none transition focus:border-accent focus:ring-4 focus:ring-teal-100"
          >
            <option value={allYearsValue}>Todos los años</option>
            {years.map((year) => (
              <option key={`target-${year}`} value={year}>{year}</option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 md:col-span-2 xl:col-span-1"
        >
          Comparar
        </button>
      </form>
    </Card>
  );
}

export default async function ComparisonPage({ searchParams }) {
  const params = await searchParams;
  const datasets = await listDatasets();
  const records = await buildDashboardRecords(datasets);
  const snapshot = buildComparisonSnapshot(datasets, records, {
    baseYear: params?.baseYear,
    targetYear: params?.targetYear,
  });

  return (
    <AppShell
      title="Comparacion anual"
      description="Comparacion real entre años limpios disponibles en la sesion."
      sidebarContext={{
        eyebrow: "Analisis anual",
        title: "Comparacion anual",
        description: "Compara indicadores y distribucion por edad entre años limpios y validados.",
        badge: snapshot.isReady ? snapshot.badgeLabel : "Sin contraste",
      }}
    >
      {snapshot.isReady ? (
        <div className="flex min-h-full min-w-0 flex-col gap-5 sm:gap-6">
          <ComparisonControls
            years={snapshot.availableYears}
            baseYear={snapshot.baseYear}
            targetYear={snapshot.mode === "all" ? snapshot.allYearsValue : snapshot.targetYear}
            allYearsValue={snapshot.allYearsValue}
          />
          {snapshot.mode === "pair" ? (
            <ComparisonKpis items={snapshot.metrics} baseYear={snapshot.baseYear} targetYear={snapshot.targetYear} />
          ) : null}
          <ComparisonChartGuide snapshot={snapshot} />
          <ComparisonChart snapshot={snapshot} />
          <ComparisonAgeLineChart snapshot={snapshot} />
          {snapshot.showTrendCharts ? (
            <ComparisonIndicatorTrendCharts snapshot={snapshot} />
          ) : (
            <Card
              title="Graficas de tendencia no disponibles aun"
              subtitle="Las tres graficas de linea por indicador aparecen cuando comparas 3 o mas años y existe cobertura comparable."
            />
          )}
        </div>
      ) : (
        <EmptyState title="Comparacion no disponible" description={snapshot.message} />
      )}
    </AppShell>
  );
}

