import { listDatasetsLocal, listProcessRecordsLocal } from "@/lib/indexeddb/repository";

function getProgress(status) {
  if (status === "clean") return 100;
  if (status === "error") return 100;
  if (status === "processing") return 60;
  return 10;
}

function normalizeProcessLogs(logs, datasetStatus) {
  if (!Array.isArray(logs) || !logs.length) {
    return [
      {
        label: "Estado actual",
        note: `Estado del dataset: ${datasetStatus || "pending"}.`,
        status: datasetStatus || "pending",
      },
    ];
  }

  return logs.map((log, index) => ({
    label: log.label || log.step || `Paso ${index + 1}`,
    note: log.note || log.message || "Sin detalle adicional.",
    status: log.status || "complete",
  }));
}

export async function getCurrentProcessesLocal() {
  const [datasets, processRecords] = await Promise.all([listDatasetsLocal(), listProcessRecordsLocal()]);
  const processByDataset = processRecords.reduce((accumulator, process) => {
    accumulator[process.datasetId] = process;
    return accumulator;
  }, {});

  return datasets
    .map((dataset) => {
      const process = processByDataset[dataset.id] || null;
      const resolvedStatus = process?.status || dataset.status || "pending";
      const steps = normalizeProcessLogs(process?.logs, resolvedStatus);

      return {
        datasetId: dataset.id,
        label: dataset.isPrimary
          ? "Dataset base 2024 listo para analisis inicial"
          : `${dataset.fileName} - ${dataset.displayYear}`,
        progress: getProgress(resolvedStatus),
        status: resolvedStatus,
        steps,
        startedAt: process?.startedAt || dataset.uploadedAt || null,
      };
    })
    .sort((left, right) => {
      if (left.datasetId === "base-2024") return -1;
      if (right.datasetId === "base-2024") return 1;
      return String(right.startedAt || "").localeCompare(String(left.startedAt || ""));
    });
}

