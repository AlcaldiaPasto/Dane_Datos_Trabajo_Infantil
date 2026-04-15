"use client";

import { useMemo, useState, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useRouter, useSearchParams } from "next/navigation";
import ComparisonKpis from "@/components/comparison/comparison-kpis";
import ComparisonChart from "@/components/comparison/comparison-chart";
import ComparisonChartGuide from "@/components/comparison/comparison-chart-guide";
import ComparisonAgeLineChart from "@/components/comparison/comparison-age-line-chart";
import ComparisonIndicatorTrendCharts from "@/components/comparison/comparison-indicator-trend-charts";
import EmptyState from "@/components/ui/empty-state";
import Card from "@/components/ui/card";
import { buildComparisonSnapshot } from "@/lib/analytics/comparison-service";
import { ensureClientBootstrap } from "@/lib/indexeddb/bootstrap";
import { buildDashboardRecordsFromLocalDatasets } from "@/lib/indexeddb/dashboard-records";
import { listCleanDatasetsLocal, listDatasetsLocal } from "@/lib/indexeddb/repository";

function ComparisonControls({ years, baseYear, targetYear, allYearsValue }) {
  const router = useRouter();
  const [baseValue, setBaseValue] = useState(String(baseYear || ""));
  const [targetValue, setTargetValue] = useState(String(targetYear || allYearsValue));

  function handleSubmit(event) {
    event.preventDefault();
    const query = new URLSearchParams();
    if (baseValue) query.set("baseYear", baseValue);
    if (targetValue) query.set("targetYear", targetValue);
    router.replace(`/comparacion?${query.toString()}`, { scroll: false });
  }

  return (
    <Card title="Seleccionar comparacion" subtitle="Compara trabajo infantil entre dos anos o en todos los anos disponibles.">
      <form
        onSubmit={handleSubmit}
        className="grid min-w-0 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] xl:items-end"
      >
        <label className="block">
          <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted">Ano base</span>
          <select
            value={baseValue}
            onChange={(event) => setBaseValue(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm font-semibold text-foreground outline-none transition focus:border-accent focus:ring-4 focus:ring-teal-100"
          >
            {years.map((year) => (
              <option key={`base-${year}`} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted">Ano comparado</span>
          <select
            value={targetValue}
            onChange={(event) => setTargetValue(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm font-semibold text-foreground outline-none transition focus:border-accent focus:ring-4 focus:ring-teal-100"
          >
            <option value={allYearsValue}>Todos los anos</option>
            {years.map((year) => (
              <option key={`target-${year}`} value={year}>
                {year}
              </option>
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

export default function ComparisonIndexedDbPage() {
  const searchParams = useSearchParams();
  const [bootstrapStatus, setBootstrapStatus] = useState("loading");
  const [bootstrapError, setBootstrapError] = useState("");

  useEffect(() => {
    let mounted = true;
    ensureClientBootstrap()
      .then(() => {
        if (!mounted) return;
        setBootstrapStatus("ready");
      })
      .catch((error) => {
        if (!mounted) return;
        setBootstrapStatus("error");
        setBootstrapError(error?.message || "No se pudo inicializar almacenamiento local.");
      });

    return () => {
      mounted = false;
    };
  }, []);

  const datasets = useLiveQuery(
    async () => {
      if (bootstrapStatus !== "ready") return [];
      return listDatasetsLocal();
    },
    [bootstrapStatus],
    []
  );

  const cleanDatasets = useLiveQuery(
    async () => {
      if (bootstrapStatus !== "ready") return [];
      return listCleanDatasetsLocal();
    },
    [bootstrapStatus],
    []
  );

  const records = useMemo(
    () => buildDashboardRecordsFromLocalDatasets(cleanDatasets || []),
    [cleanDatasets]
  );

  const comparisonParams = useMemo(
    () => ({
      baseYear: searchParams.get("baseYear"),
      targetYear: searchParams.get("targetYear"),
    }),
    [searchParams]
  );

  const snapshot = useMemo(
    () => buildComparisonSnapshot(datasets || [], records, comparisonParams),
    [datasets, records, comparisonParams]
  );

  if (bootstrapStatus === "error") {
    return (
      <Card title="Error de almacenamiento local" subtitle="No fue posible construir la comparacion anual local.">
        <p className="text-sm text-rose-700">{bootstrapError}</p>
      </Card>
    );
  }

  if (bootstrapStatus === "loading") {
    return (
      <Card title="Cargando comparacion anual" subtitle="Leyendo datasets limpios desde IndexedDB.">
        <p className="text-sm text-muted">Espera un momento...</p>
      </Card>
    );
  }

  return snapshot.isReady ? (
    <div className="flex min-h-full min-w-0 flex-col gap-5 sm:gap-6">
      <ComparisonControls
        key={`controls-${snapshot.baseYear}-${snapshot.mode === "all" ? "all" : snapshot.targetYear}`}
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
          subtitle="Las tres graficas de linea por indicador aparecen cuando comparas 3 o mas anos y existe cobertura comparable."
        />
      )}
    </div>
  ) : (
    <EmptyState title="Comparacion no disponible" description={snapshot.message} />
  );
}
