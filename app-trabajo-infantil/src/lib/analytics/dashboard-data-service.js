import { promises as fs } from "node:fs";
import { deriveDashboardRecord } from "@/lib/analytics/dashboard-calculations";
import { parseCsvText } from "@/lib/csv/parser";

async function readDatasetRows(dataset) {
  if (dataset.cleanPath) {
    const content = await fs.readFile(dataset.cleanPath, "utf8");
    const cleaned = JSON.parse(content.replace(/^\uFEFF/, ""));
    return cleaned.rows || [];
  }

  const content = await fs.readFile(dataset.rawPath, "utf8");
  return parseCsvText(content).rows;
}

export async function buildDashboardRecords(datasets) {
  const cleanDatasets = datasets.filter((dataset) => dataset.status === "clean" && dataset.rawPath);
  const records = [];

  for (const dataset of cleanDatasets) {
    try {
      const rows = await readDatasetRows(dataset);
      records.push(...rows.map((row, index) => deriveDashboardRecord(row, dataset, index)));
    } catch {
      continue;
    }
  }

  return records;
}
