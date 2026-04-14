import { promises as fs } from "node:fs";
import path from "node:path";
import { parentPort, workerData } from "node:worker_threads";
import { deriveDashboardRecord } from "../analytics/dashboard-calculations.js";
import { filterRowsForPasto } from "../csv/pasto-filter.js";

async function readJson(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content.replace(/^\uFEFF/, ""));
}

async function main() {
  const { dataset, metadataPath, dashboardRecordsPath, lockPath } = workerData;
  const cleaned = await readJson(dataset.cleanPath);
  const columns = cleaned.columns || dataset.cleanedColumns || [];
  const filterResult = filterRowsForPasto(cleaned.rows || [], columns);
  const rows = filterResult.rows;
  const records = rows.map((row, index) => deriveDashboardRecord(row, dataset, index));
  const metadata = await readJson(metadataPath);
  const now = new Date().toISOString();

  await fs.writeFile(
    dashboardRecordsPath,
    JSON.stringify(
      {
        datasetId: dataset.id,
        detectedYear: dataset.detectedYear,
        rowCount: records.length,
        records,
        generatedAt: now,
      },
      null,
      2
    ),
    "utf8"
  );

  await fs.writeFile(
    metadataPath,
    JSON.stringify(
      {
        ...metadata,
        rowCount: records.length,
        sourceRowCount: metadata.sourceRowCount || cleaned.rowCount || filterResult.summary.sourceRows,
        pastoFilter: filterResult.summary,
        dashboardRecordsPath,
        updatedAt: now,
      },
      null,
      2
    ),
    "utf8"
  );

  await fs.rm(lockPath, { force: true });
  parentPort?.postMessage({ ok: true, datasetId: dataset.id, rowCount: records.length });
}

main().catch(async (error) => {
  if (workerData?.lockPath) {
    await fs.rm(workerData.lockPath, { force: true }).catch(() => {});
  }
  parentPort?.postMessage({ ok: false, datasetId: workerData?.dataset?.id, error: error?.message });
});
