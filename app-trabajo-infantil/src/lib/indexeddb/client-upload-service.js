import { DATASET_STATUS } from "@/lib/constants/dataset-status";
import { buildDatasetFromCsvText } from "@/lib/indexeddb/client-dataset-processing";
import { ensureClientBootstrap } from "@/lib/indexeddb/bootstrap";
import { extractCsvInputFromFile } from "@/lib/indexeddb/client-file-extractor";
import { putDataset, putProcess } from "@/lib/indexeddb/repository";

function buildDatasetId() {
  const randomPart =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `upload-${Date.now()}-${randomPart}`;
}

function appendArchiveMetadata(dataset, archiveInfo, sourceCsvName, originalFileName) {
  return {
    ...dataset,
    originalFileName,
    sourceCsvName: sourceCsvName || originalFileName,
    archiveInfo: archiveInfo || null,
    summary: {
      ...(dataset.summary || {}),
      archiveInfo: archiveInfo || null,
    },
  };
}

function appendArchiveLog(logs, archiveInfo) {
  if (!archiveInfo?.isArchive) return logs;
  const now = new Date().toISOString();
  return [
    {
      at: now,
      step: "extraccion_zip",
      status: "complete",
      message: `ZIP procesado. CSV seleccionado: ${archiveInfo.sourceCsvName}.`,
    },
    ...logs,
  ];
}

export async function ingestLocalDatasetFile(file) {
  await ensureClientBootstrap();
  const datasetId = buildDatasetId();

  const processingRecord = {
    id: `process-${datasetId}`,
    datasetId,
    status: DATASET_STATUS.PROCESSING,
    currentStep: "processing",
    startedAt: new Date().toISOString(),
    finishedAt: null,
    logs: [
      {
        at: new Date().toISOString(),
        step: "inicio",
        status: "processing",
        message: "Archivo recibido. Iniciando lectura local y procesamiento.",
      },
    ],
    errorMessage: null,
  };

  await putProcess(processingRecord);

  try {
    const extracted = await extractCsvInputFromFile(file);
    const built = buildDatasetFromCsvText({
      datasetId,
      sourceType: "upload",
      fileName: file.name || extracted.sourceCsvName || "dataset.csv",
      csvText: extracted.csvText,
    });

    const dataset = appendArchiveMetadata(
      built.dataset,
      extracted.archiveInfo,
      extracted.sourceCsvName,
      file.name || "dataset.csv"
    );
    const process = {
      ...built.process,
      logs: appendArchiveLog(built.process.logs || [], extracted.archiveInfo),
    };

    await putDataset(dataset);
    await putProcess(process);

    return {
      ok: process.status === DATASET_STATUS.CLEAN,
      dataset,
      process,
      issues: dataset.issues || [],
    };
  } catch (error) {
    const failedProcess = {
      ...processingRecord,
      status: DATASET_STATUS.ERROR,
      currentStep: "error",
      finishedAt: new Date().toISOString(),
      logs: [
        ...processingRecord.logs,
        {
          at: new Date().toISOString(),
          step: "error",
          status: "error",
          message: error?.message || "Error inesperado al procesar el archivo local.",
        },
      ],
      errorMessage: error?.message || "Error inesperado al procesar el archivo local.",
    };

    await putProcess(failedProcess);

    return {
      ok: false,
      dataset: null,
      process: failedProcess,
      issues: [failedProcess.errorMessage],
      error: failedProcess.errorMessage,
    };
  }
}

