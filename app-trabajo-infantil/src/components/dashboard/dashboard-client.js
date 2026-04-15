"use client";

import Papa from "papaparse";
import { useMemo, useState } from "react";
import KpiCard from "@/components/dashboard/kpi-card";
import FilterPanel from "@/components/dashboard/filter-panel";
import SummaryTable from "@/components/dashboard/summary-table";
import BarChart from "@/components/dashboard/charts/bar-chart";
import PieChart from "@/components/dashboard/charts/pie-chart";
import ColumnChart from "@/components/dashboard/charts/column-chart";
import {
  applyDashboardFilters,
  buildDashboardSnapshotFromRecords,
  buildFilterOptions,
  getDefaultFilters,
} from "@/lib/analytics/dashboard-calculations";

function downloadBlobFile(fileName, mimeType, content) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function KpiGrid({ kpis }) {
  return (
    <section className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
  onExportJson,
  onExportCsv,
  page,
  onPageChange,
  children,
}) {
  return (
    <section className="mt-4 grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(320px,0.78fr)_minmax(0,1.22fr)] 2xl:grid-cols-[minmax(360px,0.72fr)_minmax(0,1.28fr)]">
      <FilterPanel
        filters={filters}
        options={filterOptions}
        filteredTotal={filteredTotal}
        onChange={onFilterChange}
        onReset={onReset}
        onExportJson={onExportJson}
        onExportCsv={onExportCsv}
        page={page}
        onPageChange={onPageChange}
      />
      <div className="grid min-w-0 gap-5">{children}</div>
    </section>
  );
}

function PrimaryDashboardView({ snapshot }) {
  const situationSubtitle = snapshot.situationChart.fallbackNote
    ? `Recuento compacto por actividad principal. ${snapshot.situationChart.fallbackNote}`
    : "Recuento compacto por actividad principal. Se actualiza con filtros.";

  return (
    <>
      <BarChart
        title="Situacion principal del menor"
        subtitle={situationSubtitle}
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
      <div className="grid min-w-0 items-stretch gap-5 xl:grid-cols-2">
        <ColumnChart
          title="Distribucion por edad"
          subtitle="Cantidad de menores por edad en grafica de columnas."
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

  const filteredRecords = useMemo(() => applyDashboardFilters(records, filters), [records, filters]);
  const snapshot = useMemo(() => buildDashboardSnapshotFromRecords(records, filters), [filters, records]);

  function handleFilterChange(key, value) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [key]: value,
    }));
  }

  function handleReset() {
    setFilters(defaultFilters);
  }

  function handleExportSummaryJson() {
    const payload = {
      exportedAt: new Date().toISOString(),
      scope: "dashboard-local-indexeddb",
      filters,
      snapshot,
    };
    downloadBlobFile("dashboard-resumen.json", "application/json;charset=utf-8;", JSON.stringify(payload, null, 2));
  }

  function handleExportTableCsv() {
    const rows = filteredRecords.map((record) => ({
      datasetId: record.datasetId,
      anio: record.year,
      sexo: record.sex,
      edad: record.age,
      trabaja: record.works,
      estudia: record.studies,
      trabajoEconomico: record.economicWork,
      oficiosIntensivos: record.intensiveChores,
      trabajoInfantilAmpliado: record.expandedChildLabor,
      horasOficiosHogar: record.domesticHours,
      clasificacionCargaDomestica: record.domesticCategory,
      situacionPrincipal: record.situation,
      riesgoFinal: record.riskFinal,
    }));
    const csv = Papa.unparse(rows);
    downloadBlobFile("dashboard-tabla-filtrada.csv", "text/csv;charset=utf-8;", csv);
  }

  return (
    <div className="flex min-h-full min-w-0 flex-col">
      <KpiGrid kpis={snapshot.kpis} />
      <DashboardAnalyticsFrame
        filters={filters}
        filterOptions={filterOptions}
        filteredTotal={snapshot.filteredTotal}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
        onExportJson={handleExportSummaryJson}
        onExportCsv={handleExportTableCsv}
        page={page}
        onPageChange={setPage}
      >
        {page === 0 ? <PrimaryDashboardView snapshot={snapshot} /> : <DetailDashboardView snapshot={snapshot} />}
      </DashboardAnalyticsFrame>
    </div>
  );
}
