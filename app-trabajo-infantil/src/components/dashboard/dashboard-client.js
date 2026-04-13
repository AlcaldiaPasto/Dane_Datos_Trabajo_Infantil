"use client";

import { useMemo, useState } from "react";
import KpiCard from "@/components/dashboard/kpi-card";
import FilterPanel from "@/components/dashboard/filter-panel";
import SummaryTable from "@/components/dashboard/summary-table";
import BarChart from "@/components/dashboard/charts/bar-chart";
import PieChart from "@/components/dashboard/charts/pie-chart";
import LineChart from "@/components/dashboard/charts/line-chart";
import {
  buildDashboardSnapshotFromRecords,
  buildFilterOptions,
  getDefaultFilters,
} from "@/lib/analytics/dashboard-calculations";

function KpiGrid({ kpis }) {
  return (
    <section className="grid min-w-0 gap-4 md:grid-cols-2 2xl:grid-cols-4">
      {kpis.map((kpi, index) => (
        <KpiCard key={kpi.label} index={index} compact {...kpi} />
      ))}
    </section>
  );
}

function DashboardAnalyticsFrame({
  filters,
  filterOptions,
  filteredTotal,
  onFilterChange,
  onReset,
  page,
  onPageChange,
  children,
}) {
  return (
    <section className="mt-4 grid min-w-0 items-stretch gap-5 xl:grid-cols-[minmax(340px,0.78fr)_minmax(0,1.22fr)]">
      <FilterPanel
        filters={filters}
        options={filterOptions}
        filteredTotal={filteredTotal}
        onChange={onFilterChange}
        onReset={onReset}
        page={page}
        onPageChange={onPageChange}
      />

      <div className="grid h-full min-w-0 gap-5">{children}</div>
    </section>
  );
}

function PrimaryDashboardView({ snapshot }) {
  return (
    <>
      <BarChart
        title="Situacion principal del menor"
        subtitle="Recuento compacto por actividad principal. Se actualiza con filtros."
        categories={snapshot.situationChart.categories}
        values={snapshot.situationChart.values}
        height={190}
      />
      <PieChart
        title="Distribucion de carga domestica"
        subtitle="Clasificacion por horas semanales de oficios del hogar."
        slices={snapshot.domesticDonut}
        height={210}
      />
    </>
  );
}

function DetailDashboardView({ snapshot }) {
  return (
    <>
      <div className="grid min-w-0 items-stretch gap-6 2xl:grid-cols-2">
        <LineChart
          title="Distribucion por edad"
          subtitle="Cantidad de menores por edad dentro del filtro activo."
          categories={snapshot.ageChart.categories}
          values={snapshot.ageChart.values}
          height={200}
        />
        <PieChart
          title="Distribucion por sexo"
          subtitle="Balance de la muestra filtrada."
          slices={snapshot.sexDonut}
          height={200}
        />
      </div>
      <SummaryTable rows={snapshot.summaryRows} />
    </>
  );
}

export default function DashboardClient({ records }) {
  const defaultFilters = useMemo(() => getDefaultFilters(records), [records]);
  const filterOptions = useMemo(() => buildFilterOptions(records), [records]);
  const [filters, setFilters] = useState(defaultFilters);
  const [page, setPage] = useState(0);
  const snapshot = useMemo(
    () => buildDashboardSnapshotFromRecords(records, filters),
    [filters, records]
  );

  function handleFilterChange(key, value) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [key]: value,
    }));
  }

  function handleReset() {
    setFilters(defaultFilters);
  }

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden">
      <KpiGrid kpis={snapshot.kpis} />

      <DashboardAnalyticsFrame
        filters={filters}
        filterOptions={filterOptions}
        filteredTotal={snapshot.filteredTotal}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
        page={page}
        onPageChange={setPage}
      >
        {page === 0 ? <PrimaryDashboardView snapshot={snapshot} /> : <DetailDashboardView snapshot={snapshot} />}
      </DashboardAnalyticsFrame>
    </div>
  );
}
