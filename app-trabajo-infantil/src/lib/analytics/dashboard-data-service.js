import { promises as fs } from "node:fs";
import { deriveDashboardRecord } from "@/lib/analytics/dashboard-calculations";
import { withCoverageFallback } from "@/lib/analytics/indicator-coverage";
import { filterRowsForPasto } from "@/lib/csv/pasto-filter";
import { parseCsvText } from "@/lib/csv/parser";
import { getDashboardRecordsPath, scheduleDashboardCacheBuild } from "@/lib/datasets/dashboard-cache-scheduler";

const LARGE_DATASET_THRESHOLD = 5000;

function applyCoverageToRecord(record, coverage) {
  return {
    ...record,
    age: coverage.age ? record.age : null,
    sex: coverage.sex ? record.sex : null,
    studies: coverage.studies ? record.studies : null,
    works: coverage.economicWork ? record.works : null,
    economicWork: coverage.economicWork ? record.economicWork : null,
    domesticHours: coverage.domesticHours ? record.domesticHours : null,
    domesticCategory: coverage.domesticHours ? record.domesticCategory : null,
    intensiveChores: coverage.intensiveChores ? record.intensiveChores : null,
    expandedChildLabor: coverage.expandedChildLabor ? record.expandedChildLabor : null,
    situation: coverage.situation ? record.situation : null,
    riskFinal: coverage.riskFinal ? record.riskFinal : null,
  };
}

async function readDashboardRecordsCache(dataset) {
  const dashboardRecordsPath = dataset.dashboardRecordsPath || getDashboardRecordsPath(dataset);
  if (!dashboardRecordsPath) return null;

  try {
    const content = await fs.readFile(dashboardRecordsPath, "utf8");
    const cached = JSON.parse(content.replace(/^\uFEFF/, ""));
    return Array.isArray(cached.records) ? cached.records : null;
  } catch {
    return null;
  }
}

async function readDatasetRows(dataset) {
  if (dataset.cleanPath) {
    const content = await fs.readFile(dataset.cleanPath, "utf8");
    const cleaned = JSON.parse(content.replace(/^\uFEFF/, ""));
    return filterRowsForPasto(cleaned.rows || [], cleaned.columns || dataset.cleanedColumns || []).rows;
  }

  const content = await fs.readFile(dataset.rawPath, "utf8");
  const parsed = parseCsvText(content);
  return filterRowsForPasto(parsed.rows, parsed.headers).rows;
}

export async function buildDashboardRecords(datasets) {
  const cleanDatasets = datasets.filter((dataset) => dataset.status === "clean" && dataset.rawPath);
  const records = [];

  for (const dataset of cleanDatasets) {
    const indicatorCoverage = withCoverageFallback(dataset);
    try {
      const cachedRecords = await readDashboardRecordsCache(dataset);
      if (cachedRecords) {
        records.push(...cachedRecords.map((record) => applyCoverageToRecord(record, indicatorCoverage)));
        continue;
      }

      const estimatedRows = Number(dataset.sourceRowCount || dataset.rowCount || 0);
      if (dataset.cleanPath && estimatedRows > LARGE_DATASET_THRESHOLD) {
        scheduleDashboardCacheBuild(dataset);
        continue;
      }

      const rows = await readDatasetRows(dataset);
      records.push(
        ...rows.map((row, index) =>
          deriveDashboardRecord(row, { ...dataset, indicatorCoverage }, index)
        )
      );
    } catch {
      continue;
    }
  }

  return records;
}
