import { promises as fs } from "node:fs";
import Papa from "papaparse";
import { deriveDashboardRecord } from "@/lib/analytics/dashboard-calculations";

function parseCsv(text) {
  const parsed = Papa.parse(String(text || "").replace(/^\uFEFF/, ""), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => String(header || "").trim(),
  });

  return parsed.data.filter((row) =>
    Object.values(row).some((value) => String(value || "").trim() !== "")
  );
}

async function readDatasetRows(dataset) {
  if (dataset.cleanPath) {
    const content = await fs.readFile(dataset.cleanPath, "utf8");
    const cleaned = JSON.parse(content.replace(/^\uFEFF/, ""));
    return cleaned.rows || [];
  }

  const content = await fs.readFile(dataset.rawPath, "utf8");
  return parseCsv(content);
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
