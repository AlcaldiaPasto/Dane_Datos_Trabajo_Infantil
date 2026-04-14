import { promises as fs } from "node:fs";
import Papa from "papaparse";
import { buildDashboardRecords } from "@/lib/analytics/dashboard-data-service";
import {
  ALL_FILTER_VALUE,
  buildDashboardSnapshotFromRecords,
  getDefaultFilters,
} from "@/lib/analytics/dashboard-calculations";
import { cleanRows } from "@/lib/csv/cleaner";
import { filterRowsForPasto } from "@/lib/csv/pasto-filter";
import { parseCsvText } from "@/lib/csv/parser";
import { getRegisteredDatasetById } from "@/lib/datasets/dataset-registry";
import { listDatasets } from "@/lib/datasets/dataset-service";

const DASHBOARD_FILTER_KEYS = ["year", "sex", "age", "works", "studies", "riskFinal"];

function toCsv(columns, rows) {
  return Papa.unparse({
    fields: columns,
    data: rows.map((row) => columns.map((column) => row[column] ?? "")),
  });
}

function buildFiltersFromSearchParams(searchParams, records) {
  const filters = getDefaultFilters(records);

  for (const key of DASHBOARD_FILTER_KEYS) {
    const value = searchParams.get(key);
    if (value !== null && value !== "") {
      filters[key] = value;
    }
  }

  return filters;
}

function buildFileSlug(value) {
  return String(value || "dataset")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w.-]+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 90);
}

export function buildDownloadHeaders({ fileName, contentType }) {
  return {
    "Content-Type": contentType,
    "Content-Disposition": `attachment; filename="${buildFileSlug(fileName)}"`,
    "Cache-Control": "no-store",
  };
}

export function buildJsonDownload(data) {
  return JSON.stringify(data, null, 2);
}

export function buildCsvDownload(columns, rows) {
  return toCsv(columns, rows);
}

export async function buildProcessedDatasetExport(datasetId) {
  const dataset = await getRegisteredDatasetById(datasetId);

  if (!dataset) {
    return { ok: false, statusCode: 404, error: "Dataset no encontrado." };
  }

  if (dataset.status !== "clean") {
    return {
      ok: false,
      statusCode: 409,
      error: "Solo se pueden exportar datasets limpios y validados.",
    };
  }

  if (dataset.cleanPath) {
    const content = await fs.readFile(dataset.cleanPath, "utf8");
    const cleaned = JSON.parse(content.replace(/^\uFEFF/, ""));
    const columns = cleaned.columns || dataset.cleanedColumns || [];
    const filteredRows = filterRowsForPasto(cleaned.rows || [], columns).rows;

    return {
      ok: true,
      dataset,
      columns,
      rows: filteredRows,
      generatedAt: cleaned.generatedAt || new Date().toISOString(),
    };
  }

  const rawContent = await fs.readFile(dataset.rawPath, "utf8");
  const parsed = parseCsvText(rawContent);
  const filtered = filterRowsForPasto(parsed.rows, parsed.headers);
  const cleaned = cleanRows(filtered.rows, {
    headers: parsed.headers,
    dataset,
  });

  return {
    ok: true,
    dataset,
    columns: cleaned.headers,
    rows: cleaned.rows,
    generatedAt: new Date().toISOString(),
  };
}

export function buildDatasetSummaryPayload(exportData) {
  const { dataset, columns, rows, generatedAt } = exportData;

  return {
    generatedAt,
    dataset: {
      id: dataset.id,
      fileName: dataset.fileName,
      detectedYear: dataset.detectedYear,
      status: dataset.status,
      rowCount: rows.length,
      columnCount: columns.length,
      readyForAnalysis: dataset.readyForAnalysis,
    },
    indicators: {
      totalChildren: rows.length,
      economicWorkTotal: rows.filter((row) => row.trabajoEconomico === true).length,
      intensiveChoresTotal: rows.filter((row) => row.oficiosIntensivos === true).length,
      expandedChildLaborTotal: rows.filter((row) => row.trabajoInfantilAmpliado === true).length,
    },
    cleaningRulesApplied: dataset.cleaningRulesApplied || [],
    issues: dataset.issues || [],
  };
}

export async function buildDashboardExport(searchParams) {
  const datasets = await listDatasets();
  const records = await buildDashboardRecords(datasets);
  const filters = buildFiltersFromSearchParams(searchParams, records);
  const snapshot = buildDashboardSnapshotFromRecords(records, filters);
  const generatedAt = new Date().toISOString();

  return {
    generatedAt,
    filters: Object.fromEntries(
      Object.entries(filters).map(([key, value]) => [key, value === ALL_FILTER_VALUE ? "Todos" : value])
    ),
    recordCount: snapshot.filteredTotal,
    kpis: snapshot.kpis.map((kpi) => ({
      indicator: kpi.label,
      value: kpi.value,
      support: kpi.note,
      detail: `${kpi.delta.label}: ${kpi.delta.value}`,
    })),
    summaryRows: snapshot.summaryRows,
    annualComparison: snapshot.annualComparison,
  };
}
