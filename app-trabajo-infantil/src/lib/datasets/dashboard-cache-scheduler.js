import { promises as fs } from "node:fs";
import path from "node:path";
import { Worker } from "node:worker_threads";

function getDatasetDir(dataset) {
  return dataset.cleanPath ? path.dirname(dataset.cleanPath) : null;
}

export function getDashboardRecordsPath(dataset) {
  const datasetDir = getDatasetDir(dataset);
  return datasetDir ? path.join(datasetDir, "dashboard-records.json") : null;
}

export function scheduleDashboardCacheBuild(dataset) {
  if (dataset.status !== "clean" || !dataset.cleanPath) return;

  const datasetDir = getDatasetDir(dataset);
  const dashboardRecordsPath = dataset.dashboardRecordsPath || getDashboardRecordsPath(dataset);
  if (!datasetDir || !dashboardRecordsPath) return;

  const lockPath = path.join(datasetDir, "dashboard-records.lock");
  const metadataPath = path.join(datasetDir, "metadata.json");

  fs.access(dashboardRecordsPath)
    .then(() => false)
    .catch(() => fs.writeFile(lockPath, String(process.pid), { flag: "wx" }).then(() => true))
    .then((lockCreated) => {
      if (!lockCreated) return;

      try {
        const workerPath = path.join(process.cwd(), "src", "lib", "datasets", "dataset-dashboard-cache-worker.mjs");
        const worker = new Worker(workerPath, {
          workerData: {
            dataset: { ...dataset, dashboardRecordsPath },
            metadataPath,
            dashboardRecordsPath,
            lockPath,
          },
        });

        worker.on("error", (error) => {
          console.error("Error en worker de cache del dashboard:", error);
        });
        worker.unref();
      } catch (error) {
        console.error("No fue posible iniciar el worker de cache del dashboard:", error);
        fs.rm(lockPath, { force: true }).catch(() => {});
      }
    })
    .catch(() => {});
}
